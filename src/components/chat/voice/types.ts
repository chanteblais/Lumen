/**
 * A voice engine turns the microphone into text for the composer. Two live
 * behind the same button: the browser's own recognition (`speechEngine`)
 * where it works, and a local Whisper model (`localEngine`) where it doesn't
 * (Brave ships no speech service; Firefox has no recognition at all).
 */

export type VoiceState = "idle" | "preparing" | "listening" | "finishing";

export type EngineCallbacks = {
  onState: (state: VoiceState) => void;
  /** `final` accumulates; `interim` is the live guess. */
  onTranscript: (final: string, interim: string) => void;
  /** Exactly once per start: the engine is idle again. `error` is one line in Lumi's voice. */
  onEnd: (final: string, error?: string) => void;
};

export type VoiceEngine = {
  start: (cb: EngineCallbacks) => void;
  /** The user tapped stop: finish up and report the transcript. */
  stop: () => void;
  /** The composer is going away: tear down silently. */
  abort: () => void;
};

export const GENERIC_ERROR = "Voice stopped working for a second. Try again?";
export const MIC_BLOCKED = "The browser blocked the microphone. Allow it in the address bar and try again.";
export const NO_MIC = "I can't find a microphone.";
