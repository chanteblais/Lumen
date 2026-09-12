"use client";

import { useCallback, useRef, useState } from "react";
import { useVoiceInput } from "./useVoiceInput";

type Props = { onSend?: (text: string) => void; busy?: boolean };

/** Join typed text and a transcript with one space, no leading space. */
function join(base: string, spoken: string) {
  const b = base.replace(/\s+$/, "");
  const s = spoken.trim();
  if (!b) return s;
  if (!s) return b;
  return `${b} ${s}`;
}

export function Composer({ onSend, busy = false }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const baseRef = useRef("");

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const voice = useVoiceInput({
    onTranscript: (final, interim) => {
      setValue(join(baseRef.current, final + interim));
      requestAnimationFrame(resize);
    },
    onEnd: (final) => {
      setValue(join(baseRef.current, final));
      requestAnimationFrame(resize);
      ref.current?.focus();
    },
  });

  const toggleVoice = () => {
    if (voice.listening) {
      voice.stop();
    } else {
      baseRef.current = value;
      voice.start();
    }
  };

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    if (voice.listening) voice.stop();
    onSend?.(text);
    setValue("");
    requestAnimationFrame(resize);
  };

  return (
    <div className="composer-dock">
      <form
        className={`composer ${voice.listening ? "is-listening" : ""}`}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <button type="button" className="icon-btn h-[60px] w-[60px] shrink-0" aria-label="Add">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          placeholder={voice.listening ? "Listening…" : "Message Lumi…"}
          aria-label="Message Lumi"
          onChange={(e) => {
            setValue(e.target.value);
            resize();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button type="submit" className="send shrink-0" aria-label="Send" disabled={value.trim().length === 0 || busy}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-9">
          {voice.supported && (
            <button
              type="button"
              className={`tool-link ${voice.listening ? "is-listening" : ""}`}
              onClick={toggleVoice}
              aria-pressed={voice.listening}
              aria-label={voice.listening ? "Stop listening" : "Speak instead of typing"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
              {voice.listening ? "Listening — tap to stop" : "Voice"}
            </button>
          )}
          {voice.error && <span className="text-[15px] text-ink-soft">{voice.error}</span>}
        </div>
        <span className="label label-mute">You don&rsquo;t have to do it alone.</span>
      </div>
    </div>
  );
}
