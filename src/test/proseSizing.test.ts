import { describe, expect, it } from "vitest";
import { snapProseSize } from "../hooks/usePuzzleDisplaySizing.ts";

describe("snapProseSize", () => {
  it("snaps down to whole multiples of 7px on a 1x screen", () => {
    expect(snapProseSize(20, 1)).toBe(14);
    expect(snapProseSize(21, 1)).toBe(21);
    expect(snapProseSize(28.4, 1)).toBe(28);
  });

  it("snaps to sevenths of a device pixel's worth on dense screens", () => {
    expect(snapProseSize(16, 3)).toBeCloseTo(14);
    expect(snapProseSize(16.5, 3)).toBeCloseTo(49 / 3);
    expect(snapProseSize(16, 2)).toBeCloseTo(14);
  });

  it("keeps whole device pixels for fractional zoom ratios", () => {
    const size = snapProseSize(16, 1.1);
    expect(size * 1.1 / 7).toBeCloseTo(Math.round(size * 1.1 / 7));
    expect(size).toBeLessThanOrEqual(16);
  });

  it("rounds up to the next snapped size rather than drop below the floor", () => {
    expect(snapProseSize(8, 1)).toBe(14);
    expect(snapProseSize(8, 3)).toBeCloseTo(14);
  });
});
