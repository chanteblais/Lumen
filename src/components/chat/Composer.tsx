"use client";

import { useRef, useState } from "react";
import { useAutoResize } from "./chat-client";
import { useVoiceInput } from "./useVoiceInput";

type Props = { onSend?: (text: string) => void; onStop?: () => void; busy?: boolean; initialValue?: string };

/** Join typed text and a transcript with one space, no leading space. */
function join(base: string, spoken: string) {
  const b = base.replace(/\s+$/, "");
  const s = spoken.trim();
  if (!b) return s;
  if (!s) return b;
  return `${b} ${s}`;
}

export function Composer({ onSend, onStop, busy = false, initialValue = "" }: Props) {
  const [value, setValue] = useState(initialValue);
  const { ref, resize } = useAutoResize();
  const baseRef = useRef("");

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
    if (voice.state === "idle") {
      baseRef.current = value;
      voice.start();
    } else if (voice.state !== "finishing") {
      voice.stop();
    }
  };

  const voiceLabel = { idle: "Voice", preparing: "Getting voice ready…", listening: "Listening — tap to stop", finishing: "Writing that down…" }[voice.state];
  const placeholder = { idle: "Message Lumi…", preparing: "Getting voice ready…", listening: "Listening…", finishing: "Writing that down…" }[voice.state];

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    if (voice.state !== "idle") voice.stop();
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
        <textarea
          ref={ref}
          rows={1}
          value={value}
          placeholder={placeholder}
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
        {busy && onStop ? (
          <button type="button" className="send shrink-0" aria-label="Stop Lumi" onClick={onStop}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" />
            </svg>
          </button>
        ) : (
          <button type="submit" className="send shrink-0" aria-label="Send" disabled={value.trim().length === 0 || busy}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          </button>
        )}
      </form>

      <div className="composer-foot mt-5 flex flex-wrap items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-9">
          {voice.supported && (
            <button
              type="button"
              className={`tool-link ${voice.listening ? "is-listening" : ""}`}
              onClick={toggleVoice}
              aria-pressed={voice.state !== "idle"}
              aria-busy={voice.state === "preparing" || voice.state === "finishing"}
              aria-label={voice.state === "idle" ? "Speak instead of typing" : "Stop listening"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
              {voiceLabel}
            </button>
          )}
          {voice.error && <span className="text-[15px] text-ink-soft">{voice.error}</span>}
        </div>
        <span className="label label-mute">You don&rsquo;t have to do it alone.</span>
      </div>
    </div>
  );
}
