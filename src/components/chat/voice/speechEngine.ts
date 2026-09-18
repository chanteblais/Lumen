import { GENERIC_ERROR, MIC_BLOCKED, NO_MIC, type EngineCallbacks, type VoiceEngine } from "./types";

/**
 * The browser's Web Speech API. Zero cost, streams interim results.
 *
 * The browser ends a recognition session on its own more often than you'd
 * think — Chrome after ~8s of initial silence (`no-speech`), when another
 * tab or app starts listening (`aborted`), and after a long stretch of
 * continuous audio (a plain `end`). The user's intent ("I tapped Voice")
 * outlives all of those: a plain end restarts quietly; the two errors get
 * one line in Lumi's voice instead of a button that silently switches off.
 */

type SpeechResultEvent = Event & {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};
type SpeechErrorEvent = Event & { error: string };
type Recognizer = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
};
type RecognizerCtor = new () => Recognizer;

export function getSpeechCtor(): RecognizerCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/**
 * Brave exposes the API but ships without the speech-service keys Chrome's
 * recognition needs (and no on-device speech component either), so every
 * session fails with `network`. The local engine takes over there.
 */
export function isBrave(): boolean {
  return typeof navigator !== "undefined" && "brave" in navigator;
}

const ERRORS: Record<string, string> = {
  "not-allowed": MIC_BLOCKED,
  "service-not-allowed": MIC_BLOCKED,
  "audio-capture": NO_MIC,
  network: "Voice needs a network connection right now.",
  "no-speech": "I didn't hear anything. Is the mic on? Tap Voice to try again.",
  aborted: "The mic went to another tab or app. Tap Voice to listen here again.",
};

/** A session that ends this soon after starting, without an error, is a browser refusing rather than a natural end. */
const QUICK_END_MS = 1000;
const MAX_QUICK_ENDS = 2;

export function createSpeechEngine(): VoiceEngine {
  let rec: Recognizer | null = null;
  let want = false;
  let final = "";
  let quickEnds = 0;
  let cb: EngineCallbacks | null = null;

  const finish = (message?: string) => {
    want = false;
    const done = cb;
    cb = null;
    done?.onEnd(final, message);
  };

  const startSession = (): boolean => {
    const Ctor = getSpeechCtor();
    if (!Ctor || rec) return false;
    const r = new Ctor();
    r.lang = typeof navigator !== "undefined" ? navigator.language : "en-US";
    r.continuous = true;
    r.interimResults = true;
    const startedAt = Date.now();
    let failure: string | undefined;

    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (!res) continue;
        const text = res[0]?.transcript ?? "";
        if (res.isFinal) final += text;
        else interim += text;
      }
      cb?.onTranscript(final, interim);
    };
    r.onerror = (e) => {
      // Our own stop()/abort() also reports `aborted`; only a foreign abort is news.
      if (e.error === "aborted" && !want) return;
      console.warn("[voice] recognition error:", e.error);
      failure = ERRORS[e.error] ?? GENERIC_ERROR;
    };
    r.onend = () => {
      rec = null;
      if (failure) return finish(failure);
      if (!want) return finish();
      // The browser ended a session the user still wants. Chrome does this
      // after a long stretch of audio; restart and carry the transcript on.
      if (Date.now() - startedAt < QUICK_END_MS && ++quickEnds >= MAX_QUICK_ENDS) {
        console.warn("[voice] recognition keeps ending immediately; giving up");
        return finish(GENERIC_ERROR);
      }
      if (!startSession()) finish(GENERIC_ERROR);
    };

    rec = r;
    try {
      r.start();
      return true;
    } catch (err) {
      console.warn("[voice] start() threw:", err);
      rec = null;
      return false;
    }
  };

  return {
    start(callbacks) {
      if (cb) return;
      cb = callbacks;
      want = true;
      final = "";
      quickEnds = 0;
      if (startSession()) cb.onState("listening");
      else finish(GENERIC_ERROR);
    },
    stop() {
      want = false;
      rec?.stop();
    },
    abort() {
      want = false;
      cb = null;
      rec?.abort();
      rec = null;
    },
  };
}
