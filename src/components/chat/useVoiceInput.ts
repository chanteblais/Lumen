"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Voice input via the browser's Web Speech API. Zero cost, no audio leaves
 * the composer's control: transcribed text lands in the textarea for the
 * user to read and send. Swap the internals for a server transcriber later
 * without changing this hook's surface.
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

function getCtor(): RecognizerCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export type VoiceInput = {
  supported: boolean;
  listening: boolean;
  /** One line in Rali's voice when something went wrong; undefined otherwise. */
  error?: string;
  start: () => void;
  stop: () => void;
};

type Options = {
  /** Called as speech is recognised. `final` accumulates; `interim` is the live guess. */
  onTranscript: (final: string, interim: string) => void;
  onEnd?: (final: string) => void;
};

const ERRORS: Record<string, string> = {
  "not-allowed": "The browser blocked the microphone. Allow it in the address bar and try again.",
  "service-not-allowed": "The browser blocked the microphone. Allow it in the address bar and try again.",
  "audio-capture": "I can't find a microphone.",
  network: "Voice needs a network connection right now.",
};

const noSubscribe = () => () => {};

export function useVoiceInput({ onTranscript, onEnd }: Options): VoiceInput {
  // Server renders "unsupported"; the client snapshot flips it after hydration.
  const supported = useSyncExternalStore(noSubscribe, () => Boolean(getCtor()), () => false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string>();
  const recRef = useRef<Recognizer | null>(null);
  const finalRef = useRef("");
  const cb = useRef<Options>({ onTranscript, onEnd });
  useEffect(() => {
    cb.current = { onTranscript, onEnd };
  });

  useEffect(() => {
    const rec = recRef;
    return () => rec.current?.abort();
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || recRef.current) return;
    const rec = new Ctor();
    rec.lang = typeof navigator !== "undefined" ? navigator.language : "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    finalRef.current = "";
    setError(undefined);

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0]?.transcript ?? "";
        if (r.isFinal) finalRef.current += text;
        else interim += text;
      }
      cb.current.onTranscript(finalRef.current, interim);
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setError(ERRORS[e.error] ?? "Voice stopped working for a second. Try again?");
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
      cb.current.onEnd?.(finalRef.current);
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      recRef.current = null;
      setError("Voice stopped working for a second. Try again?");
    }
  }, []);

  return { supported, listening, error, start, stop };
}
