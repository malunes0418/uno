import { describe, it, expect } from "vitest";
import { uvForCard, uvForBack } from "@/lib/cards/cardAtlas";

describe("cardAtlas", () => {
  it("redFive_mapsToExpectedCell", () => {
    const uv = uvForCard("Red", "Five");
    expect(uv.u).toBeCloseTo(5 / 12, 3);
    expect(uv.v).toBeCloseTo(1 - 4 / 6, 3); // row 3 → v from top
  });

  it("back_isTopLeft", () => {
    const uv = uvForBack();
    expect(uv.u).toBeCloseTo(0, 3);
    expect(uv.v).toBeCloseTo(1 - 1 / 6, 3);
  });
});
