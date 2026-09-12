"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Voice input via the browser's Web Speech API. Zero cost, no audio leaves
 * the composer's control: transcribed text lands in the textarea for the
 * user to read and send. Swap the internals for a server transcriber later
 * without changing this hook's surface.
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

function getCtor(): RecognizerCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognizerCtor; webkitSpeechRecognition?: RecognizerCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export type VoiceInput = {
  supported: boolean;
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

const GENERIC = "Voice stopped working for a second. Try again?";
const ERRORS: Record<string, string> = {
  "not-allowed": "The browser blocked the microphone. Allow it in the address bar and try again.",
  "service-not-allowed": "The browser blocked the microphone. Allow it in the address bar and try again.",
  "audio-capture": "I can't find a microphone.",
  network: "Voice needs a network connection right now.",
  "no-speech": "I didn't hear anything. Is the mic on? Tap Voice to try again.",
  aborted: "The mic went to another tab or app. Tap Voice to listen here again.",
};

/** A session that ends this soon after starting, without an error, is a browser refusing rather than a natural end. */
const QUICK_END_MS = 1000;
const MAX_QUICK_ENDS = 2;

const noSubscribe = () => () => {};

export function useVoiceInput({ onTranscript, onEnd }: Options): VoiceInput {
  // Server renders "unsupported"; the client snapshot flips it after hydration.
  const supported = useSyncExternalStore(noSubscribe, () => Boolean(getCtor()), () => false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string>();
  const recRef = useRef<Recognizer | null>(null);
  /** The user's intent: true from tap-on until tap-off or a real error. */
  const wantRef = useRef(false);
  const finalRef = useRef("");
  const quickEndsRef = useRef(0);
  /** Lets a session's `onend` start the next one without referencing itself. */
  const restartRef = useRef<() => boolean>(() => false);
  const cb = useRef<Options>({ onTranscript, onEnd });
  useEffect(() => {
    cb.current = { onTranscript, onEnd };
  });

  useEffect(() => {
    const rec = recRef;
    const want = wantRef;
    return () => {
      want.current = false;
      rec.current?.abort();
    };
  }, []);

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
  }, []);

  const finish = useCallback((message?: string) => {
    wantRef.current = false;
    setListening(false);
    if (message) setError(message);
    cb.current.onEnd?.(finalRef.current);
  }, []);

  const startSession = useCallback((): boolean => {
    const Ctor = getCtor();
    if (!Ctor || recRef.current) return false;
    const rec = new Ctor();
    rec.lang = typeof navigator !== "undefined" ? navigator.language : "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    const startedAt = Date.now();
    let failure: string | undefined;

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
      // Our own stop()/abort() also reports `aborted`; only a foreign abort is news.
      if (e.error === "aborted" && !wantRef.current) return;
      console.warn("[voice] recognition error:", e.error);
      failure = ERRORS[e.error] ?? GENERIC;
    };
    rec.onend = () => {
      recRef.current = null;
      if (failure) return finish(failure);
      if (!wantRef.current) return finish();
      // The browser ended a session the user still wants. Chrome does this
      // after a long stretch of audio; restart and carry the transcript on.
      if (Date.now() - startedAt < QUICK_END_MS && ++quickEndsRef.current >= MAX_QUICK_ENDS) {
        console.warn("[voice] recognition keeps ending immediately; giving up");
        return finish(GENERIC);
      }
      if (!restartRef.current()) finish(GENERIC);
    };

    recRef.current = rec;
    try {
      rec.start();
      return true;
    } catch (err) {
      console.warn("[voice] start() threw:", err);
      recRef.current = null;
      return false;
    }
  }, [finish]);
  useEffect(() => {
    restartRef.current = startSession;
  }, [startSession]);

  const start = useCallback(() => {
    if (recRef.current) return;
    wantRef.current = true;
    finalRef.current = "";
    quickEndsRef.current = 0;
    setError(undefined);
    if (startSession()) setListening(true);
    else finish(GENERIC);
  }, [startSession, finish]);

  return { supported, listening, error, start, stop };
}
