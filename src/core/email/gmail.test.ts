import { describe, expect, it } from "vitest";
import { cleanText, parseAddress, parseGmailMessage } from "./gmail";

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_");

describe("parseGmailMessage", () => {
  it("reads headers and the plain-text part, dropping quoted replies", () => {
    const m = parseGmailMessage({
      id: "m1",
      threadId: "t1",
      internalDate: "1789200000000",
      payload: {
        mimeType: "multipart/alternative",
        headers: [
          { name: "From", value: '"Priya Shah" <priya@example.org>' },
          { name: "Subject", value: "Draft by Friday?" },
        ],
        parts: [
          { mimeType: "text/plain", body: { data: b64("Can you send the draft by Friday?\n\nOn Mon, Priya wrote:\n> earlier stuff") } },
          { mimeType: "text/html", body: { data: b64("<p>Can you send the draft by Friday?</p>") } },
        ],
      },
    });
    expect(m).toMatchObject({ id: "m1", threadId: "t1", fromName: "Priya Shah", fromAddress: "priya@example.org", subject: "Draft by Friday?" });
    expect(m!.text).toBe("Can you send the draft by Friday?");
    expect(m!.receivedAt.getTime()).toBe(1789200000000);
  });
  it("falls back to stripped html, then the snippet", () => {
    const html = parseGmailMessage({ id: "h", threadId: "h", payload: { mimeType: "text/html", headers: [{ name: "From", value: "bot@x.io" }], body: { data: b64("<div>Your bill is <b>due</b>.<br>Thanks</div>") } } });
    expect(html!.text).toBe("Your bill is due .\nThanks");
    expect(html!.fromName).toBe("bot");
    const snip = parseGmailMessage({ id: "s", threadId: "s", snippet: "just the snippet", payload: { headers: [] } });
    expect(snip!.text).toBe("just the snippet");
    expect(snip!.subject).toBe("(no subject)");
  });
  it("returns nothing for a message without a payload", () => {
    expect(parseGmailMessage({ id: "x", threadId: "x" })).toBeUndefined();
  });
});

describe("parseAddress", () => {
  it("handles the common shapes", () => {
    expect(parseAddress("Ana <ana@x.io>")).toEqual({ name: "Ana", address: "ana@x.io" });
    expect(parseAddress("<ana@x.io>")).toEqual({ name: "ana", address: "ana@x.io" });
    expect(parseAddress("ana@x.io")).toEqual({ name: "ana", address: "ana@x.io" });
  });
});

describe("cleanText", () => {
  it("stops at a signature separator and caps length", () => {
    expect(cleanText("hello\n-- \nSent from my phone")).toBe("hello");
    expect(cleanText("a".repeat(2000)).length).toBe(1500);
  });
});
