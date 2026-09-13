import { describe, expect, it, vi } from "vitest";
import { envProblems, validateServerEnv } from "./env";

const BASE = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
  CLERK_SECRET_KEY: "sk_test_secret-value",
  DATABASE_URL: "postgresql://u:p@host:6543/postgres",
  OPENAI_API_KEY: "sk-openai-secret-value",
};

describe("envProblems", () => {
  it("passes a complete OpenAI environment", () => {
    expect(envProblems(BASE)).toEqual({ missing: [], invalid: [] });
  });

  it("names missing required keys, treating empty as missing", () => {
    expect(envProblems({ ...BASE, DATABASE_URL: undefined, CLERK_SECRET_KEY: " " }).missing.sort()).toEqual([
      "CLERK_SECRET_KEY",
      "DATABASE_URL",
    ]);
  });

  it("asks for the Anthropic key instead when LUMI_MODEL names Anthropic", () => {
    expect(envProblems({ ...BASE, LUMI_MODEL: "anthropic:claude-opus-5" })).toEqual({
      missing: ["ANTHROPIC_API_KEY"],
      invalid: [],
    });
    expect(
      envProblems({ ...BASE, OPENAI_API_KEY: undefined, LUMI_MODEL: "anthropic:claude-opus-5", ANTHROPIC_API_KEY: "a" }),
    ).toEqual({ missing: [], invalid: [] });
  });

  it("treats an empty LUMI_MODEL as unset, and a malformed one as invalid", () => {
    expect(envProblems({ ...BASE, LUMI_MODEL: "" })).toEqual({ missing: [], invalid: [] });
    expect(envProblems({ ...BASE, LUMI_MODEL: "gpt-6-astra" }).invalid).toEqual(["LUMI_MODEL"]);
  });
});

describe("validateServerEnv", () => {
  it("throws in production, naming keys and never values", () => {
    const env = { ...BASE, OPENAI_API_KEY: undefined, LUMI_MODEL: "nope" };
    expect(() => validateServerEnv(env, { production: true })).toThrow(/missing: OPENAI_API_KEY.*LUMI_MODEL must read/);
    try {
      validateServerEnv(env, { production: true });
    } catch (e) {
      const message = (e as Error).message;
      for (const value of Object.values(BASE)) expect(message).not.toContain(value);
      expect(message).not.toContain("nope");
    }
  });

  it("warns outside production", () => {
    const warn = vi.fn();
    validateServerEnv({ ...BASE, DATABASE_URL: "" }, { production: false, warn });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("missing: DATABASE_URL"));
  });

  it("is silent when everything is set", () => {
    const warn = vi.fn();
    validateServerEnv(BASE, { production: true, warn });
    expect(warn).not.toHaveBeenCalled();
  });
});
