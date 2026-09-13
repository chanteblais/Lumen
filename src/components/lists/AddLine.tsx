"use client";

import { useEffect, useRef, useState } from "react";
import { LUMI_LOST_THREAD, ThinkingDots, hasReply, textOf, useHeldChat } from "@/components/chat/chat-client";
import { Ledger } from "@/components/chat/Ledger";

/**
 * Add task: one line to Lumi, not a form. What you type goes through /api/chat
 * like anything said to her (so it's in the conversation on Home too), and she
 * files it — the list, a date if you gave one. Her reply and the ledger of what
 * she did show under the line; the page refreshes once her turn has landed.
 * The chat is held outside the line (`useHeldChat`): folding the line or
 * closing the sheet mid-turn doesn't stop her, and reopening shows her finish.
 */
export function AddLine({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const { messages, sendMessage, status, error, busy } = useHeldChat("lists-add");

  useEffect(() => input.current?.focus(), []);

  const send = () => {
    const text = value.trim();
    if (!text || busy) return;
    setValue("");
    void sendMessage({ text: `Add to my list: ${text}`, metadata: { createdAt: new Date().toISOString() } });
  };

  const reply = [...messages].reverse().find((m) => m.role === "assistant");
  const replyText = reply ? textOf(reply) : "";

  return (
    <div className="lists-add-line">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            e.preventDefault(); // folds the line, not the sheet
            onClose();
          }}
          placeholder={busy ? "Lumi’s on it…" : "What should Lumi add? She’ll file it."}
          aria-label="Something for Lumi to add"
        />
        <button type="submit" className="chip" disabled={busy || value.trim().length === 0}>
          Add
        </button>
        <button type="button" className="chip" onClick={onClose}>
          Done
        </button>
      </form>
      <div aria-live="polite">
        {status === "submitted" && <ThinkingDots />}
        {error && <p className="lists-add-reply">{LUMI_LOST_THREAD}</p>}
        {reply && hasReply(reply) && (
          <div className="lists-add-reply">
            {replyText && <p>{replyText}</p>}
            <Ledger message={reply} />
          </div>
        )}
      </div>
    </div>
  );
}
