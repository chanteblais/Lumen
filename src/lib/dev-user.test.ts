import { describe, expect, it } from "vitest";
import { devTestUserEnabled } from "./dev-user";

describe("devTestUserEnabled", () => {
  it("is on under `next dev` with the key set to 1", () => {
    expect(devTestUserEnabled({ NODE_ENV: "development", COHERENCE_DEV_USER: "1" })).toBe(true);
  });

  it("is off in production, in tests and with no NODE_ENV, even with the key set", () => {
    expect(devTestUserEnabled({ NODE_ENV: "production", COHERENCE_DEV_USER: "1" })).toBe(false);
    expect(devTestUserEnabled({ NODE_ENV: "test", COHERENCE_DEV_USER: "1" })).toBe(false);
    expect(devTestUserEnabled({ COHERENCE_DEV_USER: "1" })).toBe(false);
  });

  it("is off unless the key is exactly 1", () => {
    for (const value of [undefined, "", "0", "true", "yes", " 1"]) {
      expect(devTestUserEnabled({ NODE_ENV: "development", COHERENCE_DEV_USER: value })).toBe(false);
    }
  });
});
