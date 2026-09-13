"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createLocalEngine, localEngineAvailable } from "./voice/localEngine";
import { createSpeechEngine, getSpeechCtor, isBrave } from "./voice/speechEngine";
import type { VoiceEngine, VoiceState } from "./voice/types";

/**
 * Voice input for the composer. Transcribed text lands in the textarea for
 * the user to read and send; nothing is sent automatically.
 *
 * Two engines behind one button (see `voice/types.ts`): the browser's own
 * recognition where it works, otherwise a local Whisper model. Engine choice
 * is automatic; `localStorage.coherence.voice = "local" | "speech"` forces one
 * for testing.
 */

export type VoiceEngineName = "speech" | "local";

export type VoiceInput = {
  supported: boolean;
  engine?: VoiceEngineName;
  state: VoiceState;
  listening: boolean;
  /** One line in Lumi's voice when something went wrong; undefined otherwise. */
  error?: string;
  start: () => void;
  stop: () => void;
};

type Options = {
  /** Called as speech is recognised. `final` accumulates; `interim` is the live guess. */
  onTranscript: (final: string, interim: string) => void;
  onEnd?: (final: string) => void;
};

function pickEngine(): VoiceEngineName | undefined {
  if (typeof window === "undefined") return undefined;
  let override: string | null = null;
  try {
    override = window.localStorage.getItem("coherence.voice");
  } catch {}
  const speech = Boolean(getSpeechCtor()) && !isBrave();
  const local = localEngineAvailable();
  if (override === "local" && local) return "local";
  if (override === "speech" && getSpeechCtor()) return "speech";
  if (speech) return "speech";
  if (local) return "local";
  return undefined;
}

const noSubscribe = () => () => {};

export function useVoiceInput({ onTranscript, onEnd }: Options): VoiceInput {
  // Server renders "unsupported"; the client snapshot picks the engine after hydration.
  const engineName = useSyncExternalStore(noSubscribe, pickEngine, () => undefined);
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string>();
  const engineRef = useRef<VoiceEngine | null>(null);
  const cb = useRef<Options>({ onTranscript, onEnd });
  useEffect(() => {
    cb.current = { onTranscript, onEnd };
  });

  useEffect(() => {
    const engine = engineRef;
    return () => engine.current?.abort();
  }, []);

  const start = useCallback(() => {
    if (!engineName || engineRef.current) return;
    const engine = engineName === "speech" ? createSpeechEngine() : createLocalEngine();
    engineRef.current = engine;
    setError(undefined);
    engine.start({
      onState: setState,
      onTranscript: (final, interim) => cb.current.onTranscript(final, interim),
      onEnd: (final, message) => {
        engineRef.current = null;
        setState("idle");
        if (message) setError(message);
        cb.current.onEnd?.(final);
      },
    });
  }, [engineName]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  return { supported: Boolean(engineName), engine: engineName, state, listening: state === "listening", error, start, stop };
}
