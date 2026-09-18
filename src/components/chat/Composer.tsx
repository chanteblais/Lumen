"use client";

import type { FileUIPart } from "ai";
import { useRef, useState } from "react";
import { SHARED_FILE_ACCEPT, SHARED_FILE_LIMITS, sharedFilesIn } from "@/core/shared-files";
import { attachFiles } from "./attach";
import { useAutoResize } from "./chat-client";
import { SharedFileChip } from "./SharedFiles";
import { useVoiceInput } from "./useVoiceInput";

type Props = { onSend?: (text: string, files?: FileUIPart[]) => void; onStop?: () => void; busy?: boolean; initialValue?: string };

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
  // Files to share with the next message: picked, pasted or dropped; held only until it's sent.
  const [files, setFiles] = useState<FileUIPart[]>([]);
  const [reading, setReading] = useState(false);
  const [fileNote, setFileNote] = useState<string>();
  const [dropping, setDropping] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

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

  const attach = async (picked: File[]) => {
    if (picked.length === 0 || reading) return;
    setReading(true);
    const { parts, problem } = await attachFiles(picked, files);
    setFiles(parts);
    setFileNote(problem);
    setReading(false);
    ref.current?.focus();
  };

  const submit = () => {
    const text = value.trim();
    if ((!text && files.length === 0) || busy || reading) return;
    // Cancel, not stop: stop reports the transcript once more, which would refill the box just cleared.
    if (voice.state !== "idle") voice.cancel();
    onSend?.(text, files.length > 0 ? files : undefined);
    setValue("");
    setFiles([]);
    setFileNote(undefined);
    requestAnimationFrame(resize);
  };

  return (
    <div className="composer-dock">
      {files.length > 0 && (
        <ul className="composer-files" aria-label="To share with Lumi">
          {sharedFilesIn(files).map((file, i) => (
            <SharedFileChip key={`${i}-${file.name}`} file={file} onRemove={() => setFiles((current) => current.filter((_, j) => j !== i))} />
          ))}
        </ul>
      )}
      <form
        className={`composer ${voice.listening || dropping ? "is-listening" : ""}`}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("Files") || busy) return;
          e.preventDefault();
          setDropping(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropping(false);
        }}
        onDrop={(e) => {
          if (e.dataTransfer.files.length === 0) return;
          e.preventDefault();
          setDropping(false);
          void attach(Array.from(e.dataTransfer.files));
        }}
      >
        <button
          type="button"
          className="icon-btn composer-attach shrink-0"
          aria-label="Share a file with Lumi"
          title="Share a photo, a PDF or a text file"
          onClick={() => picker.current?.click()}
          disabled={busy || reading || files.length >= SHARED_FILE_LIMITS.count}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20.5 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.6-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" />
          </svg>
        </button>
        <input
          ref={picker}
          type="file"
          className="hidden"
          multiple
          accept={SHARED_FILE_ACCEPT}
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []);
            e.target.value = "";
            void attach(picked);
          }}
        />
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
          onPaste={(e) => {
            // A pasted screenshot is shared; pasted words go in the box as usual.
            const pasted = Array.from(e.clipboardData.files);
            if (pasted.length === 0) return;
            e.preventDefault();
            void attach(pasted);
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
          <button type="submit" className="send shrink-0" aria-label="Send" disabled={(value.trim().length === 0 && files.length === 0) || busy || reading}>
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
          {fileNote && <span className="text-[15px] text-ink-soft">{fileNote}</span>}
        </div>
        <span className="label label-mute">You don&rsquo;t have to do it alone.</span>
      </div>
    </div>
  );
}
