import { describe, it, expect } from "vitest";
import {
  atlasBackgroundStyle,
  atlasBackgroundStyleFromUv,
  uvForCard,
  uvForBack,
} from "@/lib/cards/cardAtlas";

const COLS = 12;
const ROWS = 6;

function expectedUv(col: number, row: number) {
  const cw = 1 / COLS;
  const ch = 1 / ROWS;
  return { u: col * cw, v: 1 - (row + 1) * ch, w: cw, h: ch };
}

function expectedStyleFromUv(uv: ReturnType<typeof expectedUv>) {
  const col = uv.u / uv.w;
  const row = (1 - uv.v - uv.h) / uv.h;
  return {
    backgroundSize: "1200% 600%",
    backgroundPosition: `${(col / 11) * 100}% ${(row / 5) * 100}%`,
  };
}

/** Calibrated (col, row) cells from uno_classic.png — mirrors engine Color × CardType combos. */
const ENGINE_CARD_CELLS: Array<{ color: string; type: string; col: number; row: number }> = [
  // Yellow
  ...(["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"] as const).map(
    (type, i) => ({ color: "Yellow", type, col: i, row: 1 }),
  ),
  { color: "Yellow", type: "Zero", col: 9, row: 1 },
  { color: "Yellow", type: "DrawTwo", col: 10, row: 1 },
  { color: "Yellow", type: "Skip", col: 11, row: 1 },
  { color: "Yellow", type: "Reverse", col: 0, row: 2 },
  // Red
  ...(["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"] as const).map(
    (type, i) => ({ color: "Red", type, col: i + 1, row: 2 }),
  ),
  { color: "Red", type: "Zero", col: 10, row: 2 },
  { color: "Red", type: "DrawTwo", col: 11, row: 2 },
  { color: "Red", type: "Skip", col: 0, row: 3 },
  { color: "Red", type: "Reverse", col: 1, row: 3 },
  // Blue
  ...(["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"] as const).map(
    (type, i) => ({ color: "Blue", type, col: i + 2, row: 3 }),
  ),
  { color: "Blue", type: "Zero", col: 11, row: 3 },
  { color: "Blue", type: "DrawTwo", col: 0, row: 4 },
  { color: "Blue", type: "Skip", col: 1, row: 4 },
  { color: "Blue", type: "Reverse", col: 2, row: 4 },
  // Green
  ...(["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"] as const).map(
    (type, i) => ({ color: "Green", type, col: i + 3, row: 4 }),
  ),
  { color: "Green", type: "Zero", col: 0, row: 5 },
  { color: "Green", type: "DrawTwo", col: 1, row: 5 },
  { color: "Green", type: "Skip", col: 2, row: 5 },
  { color: "Green", type: "Reverse", col: 3, row: 5 },
  // Wild
  { color: "Wild", type: "Wild", col: 1, row: 0 },
  { color: "Wild", type: "WildDrawFour", col: 6, row: 0 },
];

describe("cardAtlas", () => {
  describe.each(ENGINE_CARD_CELLS.map(({ color, type, col, row }) => [color, type, col, row] as const))(
    "uvForCard(%s, %s)",
    (color, type, col, row) => {
      it(`maps to atlas cell (${col}, ${row})`, () => {
        expect(uvForCard(color, type)).toEqual(expectedUv(col, row));
      });

      it("atlasBackgroundStyle matches calibrated UV", () => {
        const uv = uvForCard(color, type);
        const style = atlasBackgroundStyle(color, type);
        const expected = expectedStyleFromUv(uv);

        expect(style.backgroundSize).toBe(expected.backgroundSize);
        expect(style.backgroundPosition).toBe(expected.backgroundPosition);
      });
    },
  );

  it("uvForBack maps to atlas cell (0, 0)", () => {
    expect(uvForBack()).toEqual(expectedUv(0, 0));
  });

  it("atlasBackgroundStyleFromUv matches back", () => {
    const uv = uvForBack();
    const style = atlasBackgroundStyleFromUv(uv);
    const expected = expectedStyleFromUv(uv);

    expect(style.backgroundSize).toBe(expected.backgroundSize);
    expect(style.backgroundPosition).toBe(expected.backgroundPosition);
  });

  it("wildDrawFour is not green zero at (0, 5)", () => {
    expect(uvForCard("Wild", "WildDrawFour")).not.toEqual(uvForCard("Green", "Zero"));
  });
});
