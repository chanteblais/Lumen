/// <reference lib="webworker" />
import { pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

/**
 * Runs a small Whisper model off the main thread. Audio arrives as 16 kHz
 * mono Float32 samples; text goes back. The model is fetched once and kept
 * in the browser's cache, so only the first tap ever waits for a download.
 */

export type WorkerIn = { type: "load"; model: string } | { type: "transcribe"; id: number; audio: Float32Array };
export type WorkerOut = { type: "ready" } | { type: "progress"; file: string; progress: number } | { type: "result"; id: number; text: string } | { type: "error"; message: string };

const post = (m: WorkerOut) => self.postMessage(m);
let asr: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

function load(model: string) {
  asr ??= pipeline("automatic-speech-recognition", model, {
    device: "gpu" in self.navigator ? "webgpu" : "wasm",
    dtype: { encoder_model: "fp32", decoder_model_merged: "q4" },
    progress_callback: (p: { status: string; file?: string; progress?: number }) => {
      if (p.status === "progress" && p.file) post({ type: "progress", file: p.file, progress: p.progress ?? 0 });
    },
  }).catch((err) => {
    asr = null;
    throw err;
  });
  return asr;
}

self.onmessage = async ({ data }: MessageEvent<WorkerIn>) => {
  try {
    if (data.type === "load") {
      await load(data.model);
      post({ type: "ready" });
    } else if (data.type === "transcribe") {
      const run = await load("");
      const out = await run(data.audio, { chunk_length_s: 30, stride_length_s: 5 });
      const text = Array.isArray(out) ? out.map((o) => o.text).join(" ") : out.text;
      post({ type: "result", id: data.id, text: text.trim() });
    }
  } catch (err) {
    console.warn("[voice] whisper worker:", err);
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
