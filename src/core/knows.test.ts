import { describe, expect, it } from "vitest";
import type { MemoryNote } from "@/db/schema";
import { correctionError, groupBeliefs, provenanceLine } from "./knows";

const b = (over: Partial<MemoryNote>) => ({ kind: "fact", source: "user_said", confidence: 0.9, createdAt: new Date("2026-09-12T15:00:00Z"), ...over }) as MemoryNote;

describe("What Lumi knows", () => {
  it("groups by what it's about, projects first, newest first within, empty kinds left out", () => {
    const older = b({ kind: "project", content: "Grant", createdAt: new Date("2026-09-01T00:00:00Z") });
    const newer = b({ kind: "project", content: "Thesis" });
    const pref = b({ kind: "preference", content: "Short replies" });
    const groups = groupBeliefs([pref, older, newer]);
    expect(groups.map((g) => g.heading)).toEqual(["What you're working on", "How you like her to be"]);
    expect(groups[0].beliefs).toEqual([newer, older]);
  });

  it("says whose word it is, in words not numbers", () => {
    expect(provenanceLine(b({}), "America/Vancouver")).toBe("You told her · Sep 12");
    expect(provenanceLine(b({ source: "lumi_inferred", confidence: 0.55 }), "UTC")).toBe("Her guess · fairly sure · Sep 12");
    expect(provenanceLine(b({ source: "reflection", confidence: 0.3 }), "UTC")).toBe("From a session · guessing · Sep 12");
  });

  it("explains a refused correction plainly", () => {
    expect(correctionError("secret")).toMatch(/doesn't keep those/);
    expect(correctionError(undefined)).toBe("That didn't save. Try again?");
  });
});
