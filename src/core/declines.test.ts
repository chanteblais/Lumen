import { describe, expect, it } from "vitest";
import { DECLINE_REASON_KEYS, declineLabel, declineMessageText, isDeclineReason } from "./declines";

describe("declines", () => {
  it("has exactly the six quick answers", () => {
    expect(DECLINE_REASON_KEYS).toHaveLength(6);
  });
  it("recognises keys and nothing else", () => {
    expect(isDeclineReason("too_big")).toBe(true);
    expect(isDeclineReason("toString")).toBe(false);
    expect(isDeclineReason(undefined)).toBe(false);
    expect(declineLabel("nope")).toBe("Just nope");
    expect(declineLabel("free text")).toBeUndefined();
  });
  it("sends what was tapped, in words", () => {
    expect(declineMessageText("Finish discussion post", "too_big")).toBe("Not this one: Finish discussion post — too big.");
    expect(declineMessageText("Finish discussion post")).toBe("Not this one: Finish discussion post");
  });
});
