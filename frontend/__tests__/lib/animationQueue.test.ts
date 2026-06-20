import { describe, it, expect } from "vitest";
import { eventToTween } from "@/lib/animation/animationQueue";

describe("animationQueue", () => {
  it("cardPlayed_returnsArcTween", () => {
    const t = eventToTween({ type: "CardPlayed", playerId: "p1", cards: [{ color: "Red", type: "Five" }] });
    expect(t.kind).toBe("playArc");
    expect(t.durationMs).toBeGreaterThan(0);
  });
});
