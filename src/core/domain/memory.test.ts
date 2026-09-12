import { describe, expect, it } from "vitest";
import { confidenceWord, defaultConfidence, nextConfidence } from "./memory";

describe("beliefs — pure rules", () => {
  it("confirm nudges up, contradict knocks down harder, both clamp", () => {
    expect(nextConfidence(0.5, "confirm")).toBe(0.6);
    expect(nextConfidence(0.5, "contradict")).toBe(0.35);
    expect(nextConfidence(0.95, "confirm")).toBe(0.98);
    expect(nextConfidence(0.1, "contradict")).toBe(0);
  });
  it("what the user says outranks what Lumi infers", () => {
    expect(defaultConfidence("user_said", "user")).toBeGreaterThan(defaultConfidence("user_said", "lumi"));
    expect(defaultConfidence("user_said", "lumi")).toBeGreaterThan(defaultConfidence("lumi_inferred", "lumi"));
  });
  it("speaks confidence as words", () => {
    expect(confidenceWord(0.9)).toBe("sure");
    expect(confidenceWord(0.6)).toBe("fairly sure");
    expect(confidenceWord(0.3)).toBe("guessing");
  });
});
