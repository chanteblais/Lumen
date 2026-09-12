import { GENERIC_ERROR, MIC_BLOCKED, NO_MIC, type EngineCallbacks, type VoiceEngine } from "./types";
import type { WorkerIn, WorkerOut } from "./whisper.worker";

/**
 * Local transcription: the microphone feeds a small Whisper model running in
 * a worker on this machine. No audio leaves the device, no vendor, no key.
 * Used where the browser's own recognition can't work (Brave, Firefox).
 *
 * While listening, the whole recording so far is re-transcribed every few
 * seconds so words appear as you go; the stop tap does one last pass.
 */

const MODEL = "onnx-community/whisper-base.en";
const SAMPLE_RATE = 16_000;
const LIVE_EVERY_MS = 4_000;
/** Whisper re-reads the whole take on each pass; five minutes keeps that cheap. */
const MAX_SECONDS = 5 * 60;
const MIN_SECONDS = 0.4;

const WORKLET_SRC = `
class LumenPcm extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch && ch.length) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor("lumen-pcm", LumenPcm);
`;

export function localEngineAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof Worker !== "undefined" &&
    typeof AudioWorkletNode !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

/** One worker per page: the loaded model survives across taps. */
let worker: Worker | null = null;
let ready: Promise<void> | null = null;

function ensureWorker(): Promise<void> {
  if (ready) return ready;
  worker = new Worker(new URL("./whisper.worker.ts", import.meta.url), { type: "module" });
  ready = new Promise<void>((resolve, reject) => {
    const w = worker!;
    const onMessage = ({ data }: MessageEvent<WorkerOut>) => {
      if (data.type === "ready") {
        w.removeEventListener("message", onMessage);
        resolve();
      } else if (data.type === "error") {
        w.removeEventListener("message", onMessage);
        reject(new Error(data.message));
      }
    };
    w.addEventListener("message", onMessage);
    w.addEventListener("error", (e) => reject(e.error ?? new Error(e.message)), { once: true });
    w.postMessage({ type: "load", model: MODEL } satisfies WorkerIn);
  }).catch((err) => {
    worker?.terminate();
    worker = null;
    ready = null;
    throw err;
  });
  return ready;
}

let nextId = 1;
function transcribe(audio: Float32Array): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = worker;
    if (!w) return reject(new Error("worker gone"));
    const id = nextId++;
    const onMessage = ({ data }: MessageEvent<WorkerOut>) => {
      if (data.type === "result" && data.id === id) {
        w.removeEventListener("message", onMessage);
        resolve(data.text);
      } else if (data.type === "error") {
        w.removeEventListener("message", onMessage);
        reject(new Error(data.message));
      }
    };
    w.addEventListener("message", onMessage);
    w.postMessage({ type: "transcribe", id, audio } satisfies WorkerIn);
  });
}

/** Below this RMS the take is room tone; Whisper would invent words for it. */
const SILENCE_RMS = 0.004;
/** What Whisper says when it heard nothing. Exact matches only. */
const HALLUCINATIONS = new Set(["you", "thank you.", "thanks.", "thank you for watching.", "thanks for watching.", "bye."]);

function rms(audio: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < audio.length; i++) sum += audio[i] * audio[i];
  return Math.sqrt(sum / (audio.length || 1));
}

function clean(text: string): string {
  const t = text.trim();
  return HALLUCINATIONS.has(t.toLowerCase()) ? "" : t;
}

/** Linear resample for browsers that ignore the requested context rate. */
function resample(input: Float32Array, ratio: number): Float32Array {
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const pos = i * ratio;
    const j = Math.floor(pos);
    const frac = pos - j;
    out[i] = input[j] * (1 - frac) + (input[Math.min(j + 1, input.length - 1)] ?? input[j]) * frac;
  }
  return out;
}

function concat(chunks: Float32Array[], length: number): Float32Array {
  const out = new Float32Array(length);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

export function createLocalEngine(): VoiceEngine {
  let cb: EngineCallbacks | null = null;
  let stream: MediaStream | null = null;
  let ctx: AudioContext | null = null;
  let chunks: Float32Array[] = [];
  let length = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let passing = false;
  let stopping = false;
  let lastText = "";
  let micLabel = "";

  const teardown = () => {
    if (timer) clearInterval(timer);
    timer = null;
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    void ctx?.close().catch(() => {});
    ctx = null;
  };

  const finish = (final: string, message?: string) => {
    teardown();
    const done = cb;
    cb = null;
    chunks = [];
    length = 0;
    done?.onEnd(final, message);
  };

  const livePass = async () => {
    if (passing || stopping || length < SAMPLE_RATE * MIN_SECONDS) return;
    passing = true;
    try {
      const audio = concat(chunks, length);
      if (rms(audio) < SILENCE_RMS) return;
      const text = clean(await transcribe(audio));
      lastText = text;
      if (cb && !stopping) cb.onTranscript("", text);
    } catch (err) {
      console.warn("[voice] live pass failed:", err);
    } finally {
      passing = false;
    }
  };

  const capture = async () => {
    // Create the context inside the tap, before any await: a context made
    // after the permission prompt has eaten the user gesture starts
    // suspended, and a suspended context feeds the worklet nothing.
    const ac = new AudioContext({ sampleRate: SAMPLE_RATE });
    ctx = ac;
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micLabel = stream.getAudioTracks()[0]?.label ?? "";
    if (ac.state !== "running") await ac.resume();
    console.debug("[voice] mic:", micLabel || "(unnamed)", "context:", ac.state, ac.sampleRate + " Hz");
    if (ac.state !== "running") throw new Error("audio context " + ac.state);
    const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: "application/javascript" }));
    try {
      await ac.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }
    const node = new AudioWorkletNode(ac, "lumen-pcm");
    const ratio = ac.sampleRate / SAMPLE_RATE;
    node.port.onmessage = ({ data }: MessageEvent<Float32Array>) => {
      if (length >= SAMPLE_RATE * MAX_SECONDS) return;
      const frame = ratio === 1 ? data : resample(data, ratio);
      chunks.push(frame);
      length += frame.length;
    };
    ac.createMediaStreamSource(stream).connect(node);
    // The worklet needs a sink to run; it outputs silence.
    node.connect(ac.destination);
  };

  return {
    start(callbacks) {
      if (cb) return;
      cb = callbacks;
      stopping = false;
      lastText = "";
      chunks = [];
      length = 0;
      cb.onState("preparing");
      // Ask for the mic first (that's the prompt the user sees), then load
      // the model while audio is already being captured — nothing said
      // during the wait is lost.
      capture()
        .catch((err: unknown) => {
          const name = err instanceof Error ? err.name : "";
          console.warn("[voice] microphone:", err);
          throw new Error(name === "NotAllowedError" || name === "SecurityError" ? MIC_BLOCKED : name === "NotFoundError" ? NO_MIC : GENERIC_ERROR);
        })
        .then(() => ensureWorker().catch((err: unknown) => {
          console.warn("[voice] model load:", err);
          throw new Error(GENERIC_ERROR);
        }))
        .then(() => {
          if (!cb) return; // aborted meanwhile
          if (stopping) return; // stopped during preparing: finish with what we have
          cb.onState("listening");
          timer = setInterval(() => void livePass(), LIVE_EVERY_MS);
        })
        .catch((err: Error) => {
          if (cb) finish("", err.message);
        });
    },
    stop() {
      if (!cb || stopping) return;
      stopping = true;
      cb.onState("finishing");
      const audio = length >= SAMPLE_RATE * MIN_SECONDS ? concat(chunks, length) : null;
      teardown();
      if (!audio) return finish("");
      const level = rms(audio);
      console.debug("[voice] take:", (length / SAMPLE_RATE).toFixed(1), "s, rms", level.toFixed(4));
      if (level < SILENCE_RMS) return finish("", micLabel ? `I didn't hear anything from "${micLabel}". Is that the right mic? Tap Voice to try again.` : "I didn't hear anything. Is the mic on? Tap Voice to try again.");
      const wait = passing ? new Promise<void>((r) => { const t = setInterval(() => { if (!passing) { clearInterval(t); r(); } }, 50); }) : Promise.resolve();
      void wait
        .then(() => ensureWorker())
        .then(() => transcribe(audio))
        .then(clean)
        .then((text) => {
          cb?.onTranscript(text, "");
          finish(text);
        })
        .catch((err: unknown) => {
          console.warn("[voice] final pass failed:", err);
          // Keep whatever the last live pass produced rather than lose the take.
          if (lastText) {
            cb?.onTranscript(lastText, "");
            finish(lastText);
          } else finish("", GENERIC_ERROR);
        });
    },
    abort() {
      stopping = true;
      cb = null;
      teardown();
      chunks = [];
      length = 0;
    },
  };
}
