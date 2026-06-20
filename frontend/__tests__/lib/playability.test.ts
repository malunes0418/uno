import { describe, it, expect } from "vitest";
import { isPlayable } from "@/lib/cards/playability";

describe("playability", () => {
  it("matchesColorOrType", () => {
    expect(isPlayable(
      { color: "Red", type: "Five" },
      { color: "Blue", type: "Five" },
      "Blue")).toBe(true);
  });
});
