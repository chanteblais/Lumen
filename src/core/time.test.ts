import { describe, expect, it } from "vitest";
import { dayPart, describeGap, gapBucket, localDate } from "./time";

const now = new Date("2026-09-11T12:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms);
const H = 3_600_000;
const D = 24 * H;

describe("gapBucket", () => {
  it("buckets by feel, not precision", () => {
    expect(gapBucket(ago(60_000), now)).toBe("just_now");
    expect(gapBucket(ago(20 * 60_000), now)).toBe("minutes");
    expect(gapBucket(ago(3 * H), now)).toBe("hours");
    expect(gapBucket(ago(30 * H), now)).toBe("yesterday");
    expect(gapBucket(ago(4 * D), now)).toBe("days");
    expect(gapBucket(ago(12 * D), now)).toBe("week_plus");
    expect(gapBucket(ago(45 * D), now)).toBe("long");
  });
});

describe("describeGap", () => {
  it("speaks in Rali's register", () => {
    expect(describeGap(ago(3 * H), now)).toBe("3 hours ago");
    expect(describeGap(ago(30 * H), now)).toBe("yesterday");
    expect(describeGap(ago(9 * D), now)).toBe("about 1 week ago");
    expect(describeGap(ago(16 * D), now)).toBe("about 2 weeks ago");
    expect(describeGap(ago(90 * D), now)).toBe("a while ago");
  });
});

describe("timezone helpers", () => {
  it("computes the local date across the date line", () => {
    const at = new Date("2026-09-11T23:30:00Z");
    expect(localDate(at, "UTC")).toBe("2026-09-11");
    expect(localDate(at, "Pacific/Auckland")).toBe("2026-09-12");
    expect(localDate(at, "America/Los_Angeles")).toBe("2026-09-11");
  });
  it("names the part of the day", () => {
    expect(dayPart(new Date("2026-09-11T08:00:00Z"), "UTC")).toBe("morning");
    expect(dayPart(new Date("2026-09-11T15:00:00Z"), "UTC")).toBe("afternoon");
    expect(dayPart(new Date("2026-09-11T20:00:00Z"), "UTC")).toBe("evening");
    expect(dayPart(new Date("2026-09-11T02:00:00Z"), "UTC")).toBe("night");
  });
});
