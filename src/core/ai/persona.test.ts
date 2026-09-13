import { describe, expect, it } from "vitest";
import { MAIL_ON } from "@/core/email/types";
import { PERSONA } from "./persona";

describe("PERSONA — the app, and where they are", () => {
  const section = PERSONA.slice(PERSONA.indexOf("## The app, and where they are"), PERSONA.indexOf("## Coming back"));

  it("names every place in the nav, and Insights only while mail is on", () => {
    for (const place of ["Home:", "Today:", "Library:", "Lists:", "Settings:"]) expect(section).toContain(`- ${place}`);
    expect(section.includes("- Insights:")).toBe(MAIL_ON);
  });

  it("says what isn't built rather than leaving her to invent it", () => {
    expect(section).toContain("Not here yet:");
    expect(section).toContain("never invent a button");
  });

  it("stays byte-stable: no dates, no per-user content", () => {
    expect(section).not.toMatch(/\b20\d\d\b/);
    expect(section).not.toMatch(/\$\{/);
  });
});
