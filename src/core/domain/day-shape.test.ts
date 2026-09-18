import { describe, expect, it } from "vitest";
import { type DaySegment, shapeDay, type ShapeItem, spanWords } from "./day-shape";

const tz = "America/Vancouver";
const at = (iso: string) => new Date(iso);
const item = (id: string, estimateMinutes: number | null) => ({ id, estimateMinutes });
/** What the page draws: landmarks, and windows with something in them. */
const drawn = <T extends ShapeItem>(segments: DaySegment<T>[]) => segments.filter((s) => s.kind === "landmark" || s.items.length);

describe("spanWords", () => {
  it("says minutes in words, never numbers", () => {
    expect(spanWords(10)).toBeNull();
    expect(spanWords(25)).toBe("about half an hour");
    expect(spanWords(55)).toBe("about an hour");
    expect(spanWords(120)).toBe("a couple of hours");
    expect(spanWords(200)).toBe("a few hours");
    expect(spanWords(400)).toBe("most of it");
  });
});

describe("shapeDay", () => {
  // 1pm Vancouver on a Friday; practicum at 5pm.
  const now = at("2026-09-18T20:00:00Z");
  const practicum = { id: "prac", title: "Practicum", at: at("2026-09-19T00:00:00Z"), estimateMinutes: null };

  it("lays the path into the windows around what's fixed, in Lumi's order", () => {
    const shape = shapeDay([item("a", 60), item("b", 30), item("c", 45)], [practicum], now, tz);
    expect(shape.nowPart).toBe("afternoon");
    expect(drawn(shape.segments)).toMatchObject([
      { kind: "window", label: "Before Practicum", span: "a few hours", items: [item("a", 60), item("b", 30), item("c", 45)] },
      { kind: "landmark", id: "prac", title: "Practicum", at: practicum.at },
    ]);
    expect(shape.spill).toEqual([]);
  });

  it("keeps an empty window, with the room it has, so something else may fit there", () => {
    const shape = shapeDay([item("a", 60)], [practicum], now, tz);
    const after = shape.segments.find((s) => s.kind === "window" && s.label === "After Practicum");
    expect(after).toMatchObject({ items: [], minutes: 240, free: 240 });
    const before = shape.segments.find((s) => s.kind === "window" && s.label === "Before Practicum");
    expect(before).toMatchObject({ minutes: 230, free: 170 });
  });

  it("holds a thing too big for the window until after the fixed time, and lets a small one go first", () => {
    const soon = { ...practicum, at: at("2026-09-18T21:00:00Z") }; // 2pm, 50 minutes' window
    const shape = shapeDay([item("big", 90), item("small", 20)], [soon], now, tz);
    expect(drawn(shape.segments)).toMatchObject([
      { kind: "window", label: "Before Practicum", span: "about an hour", items: [item("small", 20)] },
      { kind: "landmark", id: "prac", title: "Practicum", at: soon.at },
      { kind: "window", label: "After Practicum", span: null, items: [item("big", 90)] },
    ]);
  });

  it("assumes half an hour when there's no estimate, and drops landmarks already past", () => {
    const gone = { ...practicum, id: "gone", at: at("2026-09-18T16:00:00Z") };
    const shape = shapeDay([item("a", null)], [gone], now, tz);
    expect(drawn(shape.segments)).toMatchObject([{ kind: "window", label: "The rest of the afternoon", span: null, items: [item("a", null)] }]);
    expect(shape.segments[0]).toMatchObject({ free: 540 - 30 });
  });

  it("spills what can't fit before the day ends, and calls a late window tonight", () => {
    const late = at("2026-09-19T05:30:00Z"); // 10:30pm
    const shape = shapeDay([item("a", 60)], [], late, tz);
    expect(drawn(shape.segments)).toMatchObject([{ kind: "window", label: "Tonight", span: null, items: [item("a", 60)] }]);
    const nine = at("2026-09-19T04:00:00Z"); // 9pm, an hour left
    const tight = shapeDay([item("big", 120), item("ok", 30)], [], nine, tz);
    expect(tight.segments[0]).toMatchObject({ label: "The rest of the evening", items: [item("ok", 30)] });
    expect(tight.spill).toEqual([item("big", 120)]);
  });
});
