import { describe, expect, it } from "vitest";
import { snapMinuteWithinHour, snapMinutesFromPixelOffset } from "../time-grid";

describe("time-grid", () => {
  it.each([
    [0, 0],
    [6, 15],
    [12, 15],
    [18, 30],
    [24, 30],
    [30, 45],
    [36, 45],
    [42, 60],
  ])("snaps %i px within an hour to %i minutes", (offsetPx, expectedMinutes) => {
    expect(snapMinutesFromPixelOffset(offsetPx)).toBe(expectedMinutes);
  });

  it("rounds half-step offsets away from zero in both directions", () => {
    expect(snapMinutesFromPixelOffset(-6)).toBe(-15);
  });

  it.each([
    [0, 0],
    [12, 15],
    [24, 30],
    [36, 45],
    [48, 45],
    [-12, 0],
  ])("clamps hour-cell offset %i px to minute %i", (offsetPx, expectedMinute) => {
    expect(snapMinuteWithinHour(offsetPx)).toBe(expectedMinute);
  });

  it("supports signed resize deltas", () => {
    expect(snapMinutesFromPixelOffset(-12)).toBe(-15);
  });

  it("scales snapping when hour-cell height changes", () => {
    expect(snapMinutesFromPixelOffset(15, 60)).toBe(15);
  });
});
