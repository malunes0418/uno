import type { CSSProperties } from "react";

export interface UvRect { u: number; v: number; w: number; h: number; }

/**
 * Sprite atlas for uno_classic.png — 12 columns × 6 rows (0-indexed col, row).
 * OpenGL-style V: row 0 is the top row of the image.
 *
 * Row 0 — specials:
 *   col 0: card back
 *   cols 1–5: Wild (duplicate art; col 1 is used)
 *   cols 6–10: Wild Draw Four / +4 (duplicate art; col 6 is used)
 *   col 11: blank placeholder
 *
 * Row 1 — Yellow numbers + actions:
 *   cols 0–8: 1–9, col 9: 0, col 10: +2, col 11: Skip
 *
 * Row 2 — Yellow Reverse + Red numbers + actions:
 *   col 0: Yellow Reverse, cols 1–9: Red 1–9, col 10: Red 0, col 11: Red +2
 *
 * Row 3 — Red Skip/Reverse + Blue numbers:
 *   col 0: Red Skip, col 1: Red Reverse, cols 2–10: Blue 1–9, col 11: Blue 0
 *
 * Row 4 — Blue actions + Green numbers:
 *   col 0: Blue +2, col 1: Blue Skip, col 2: Blue Reverse,
 *   cols 3–11: Green 1–9
 *
 * Row 5 — Green actions + empty cells:
 *   col 0: Green 0, col 1: Green +2, col 2: Green Skip, col 3: Green Reverse,
 *   cols 4–11: unused
 */
const COLS = 12;
const ROWS = 6;
const CW = 1 / COLS;
const CH = 1 / ROWS;

function cell(col: number, row: number): UvRect {
  return { u: col * CW, v: 1 - (row + 1) * CH, w: CW, h: CH };
}

const NUMBER_ROWS: Record<string, number> = {
  Yellow: 1, Red: 2, Blue: 3, Green: 4,
};

const NUMBER_START_COL: Record<string, number> = {
  Yellow: 0, Red: 1, Blue: 2, Green: 3,
};

const TYPE_OFFSET: Record<string, number> = {
  One: 0, Two: 1, Three: 2, Four: 3, Five: 4, Six: 5, Seven: 6,
  Eight: 7, Nine: 8, Zero: 9, DrawTwo: 10, Skip: 11,
};

/** Cards whose atlas cell wraps to the next row (staggered color bands). */
const OVERFLOW_CELLS: Record<string, Partial<Record<string, readonly [number, number]>>> = {
  Red: { Skip: [0, 3] },
  Blue: { DrawTwo: [0, 4], Skip: [1, 4] },
  Green: { Zero: [0, 5], DrawTwo: [1, 5], Skip: [2, 5] },
};

const REVERSE_CELLS: Record<string, readonly [number, number]> = {
  Yellow: [0, 2], Red: [1, 3], Blue: [2, 4], Green: [3, 5],
};

export function uvForBack(): UvRect {
  return cell(0, 0);
}

export function uvForCard(color: string, type: string): UvRect {
  if (color === "Wild") {
    if (type === "WildDrawFour") return cell(6, 0);
    return cell(1, 0);
  }
  if (type === "Reverse") {
    const [col, row] = REVERSE_CELLS[color];
    return cell(col, row);
  }
  const overflow = OVERFLOW_CELLS[color]?.[type];
  if (overflow) {
    return cell(overflow[0], overflow[1]);
  }
  const row = NUMBER_ROWS[color];
  const col = NUMBER_START_COL[color] + TYPE_OFFSET[type];
  return cell(col, row);
}

export function atlasBackgroundStyleFromUv(uv: UvRect): Pick<CSSProperties, "backgroundSize" | "backgroundPosition"> {
  const col = uv.u / uv.w;
  const row = (1 - uv.v - uv.h) / uv.h;
  return {
    backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
    backgroundPosition: `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`,
  };
}

export function atlasBackgroundStyle(color: string, type: string): Pick<CSSProperties, "backgroundSize" | "backgroundPosition"> {
  return atlasBackgroundStyleFromUv(uvForCard(color, type));
}

export const CARD_ATLAS_URL = "/uno_classic.png";
