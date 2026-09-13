import { describe, expect, it } from "vitest";
import { buildShelves, shelfPath, whyNotShelve } from "./library";

const day = (n: number) => new Date(Date.UTC(2026, 8, n));
const t = (id: string, parentId: string | null, created: number) => ({ id, parentId, createdAt: day(created) });

describe("buildShelves", () => {
  it("makes a section of a thread with threads under it, a shelf of one inside it, and leaves the rest loose", () => {
    const held = [
      t("identity", "memory", 5),
      t("memory", "coherence", 3),
      t("coherence", null, 1),
      t("onboarding", "coherence", 4),
      t("pottery", null, 2),
      t("lineage", "memory", 6),
    ];
    const { sections, loose } = buildShelves(held);
    expect(sections).toHaveLength(1);
    expect(sections[0]!.thread.id).toBe("coherence");
    expect(sections[0]!.shelves.map((s) => [s.shelf?.id ?? null, s.books.map((b) => b.id)])).toEqual([
      [null, ["onboarding"]],
      ["memory", ["identity", "lineage"]],
    ]);
    expect(loose.map((x) => x.id)).toEqual(["pottery"]);
  });

  it("keeps things in the order they arrived, so a section keeps its place as more comes in", () => {
    const held = [t("b", null, 3), t("b1", "b", 4), t("a", null, 1), t("a1", "a", 2)];
    expect(buildShelves(held).sections.map((s) => s.thread.id)).toEqual(["a", "b"]);
  });

  it("puts a thread whose parent isn't among these at the top", () => {
    expect(buildShelves([t("orphan", "gone", 1)]).loose.map((x) => x.id)).toEqual(["orphan"]);
  });
});

describe("shelfPath and whyNotShelve", () => {
  const held = [t("coherence", null, 1), t("memory", "coherence", 2), t("identity", "memory", 3), t("pottery", null, 4), t("kiln", "pottery", 5)];

  it("names where a thread sits, section first", () => {
    expect(shelfPath(held, "identity").map((x) => x.id)).toEqual(["coherence", "memory"]);
    expect(shelfPath(held, "coherence")).toEqual([]);
  });

  it("allows a loose thread under a section, and taking anything off its shelf", () => {
    expect(whyNotShelve(held, "pottery", "coherence")).toBeNull();
    expect(whyNotShelve(held, "identity", null)).toBeNull();
  });

  it("refuses itself, a loop, a thread that isn't held, and a fourth level", () => {
    expect(whyNotShelve(held, "memory", "memory")).toMatch(/itself/);
    expect(whyNotShelve(held, "coherence", "identity")).toMatch(/already under/);
    expect(whyNotShelve(held, "memory", "nope")).toBe("not found");
    expect(whyNotShelve(held, "kiln", "identity")).toMatch(/too deep/);
    expect(whyNotShelve(held, "pottery", "memory")).toMatch(/too deep/);
  });
});
