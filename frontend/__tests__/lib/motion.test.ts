import { describe, expect, it } from "vitest";
import { scaleDuration } from "@/lib/animation/motion";

describe("scaleDuration", () => {
  it("returnsOriginalDurationWhenMotionAllowed", () => {
    expect(scaleDuration(450, false)).toBe(450);
  });

  it("shortensDurationWhenReducedMotion", () => {
    expect(scaleDuration(450, true)).toBe(90);
    expect(scaleDuration(200, true)).toBe(50);
  });

  it("preservesZeroDuration", () => {
    expect(scaleDuration(0, true)).toBe(0);
  });
});
