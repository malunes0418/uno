export interface UvRect { u: number; v: number; w: number; h: number; }

const COLS = 12;
const ROWS = 6;
const CW = 1 / COLS;
const CH = 1 / ROWS;

function cell(col: number, row: number): UvRect {
  return { u: col * CW, v: 1 - (row + 1) * CH, w: CW, h: CH };
}

const NUMBER_ROWS: Record<string, number> = {
  Yellow: 1, Red: 3, Blue: 3, Green: 4,
};

const NUMBER_START_COL: Record<string, number> = {
  Yellow: 0, Red: 1, Blue: 2, Green: 3,
};

const TYPE_OFFSET: Record<string, number> = {
  One: 0, Two: 1, Three: 2, Four: 3, Five: 4, Six: 5, Seven: 6,
  Eight: 7, Nine: 8, Zero: 9, DrawTwo: 10, Skip: 11,
};

export function uvForBack(): UvRect {
  return cell(0, 0);
}

export function uvForCard(color: string, type: string): UvRect {
  if (color === "Wild") {
    if (type === "WildDrawFour") return cell(5, 0);
    return cell(1, 0);
  }
  if (type === "Reverse") {
    const reverseCol: Record<string, number> = { Yellow: 0, Red: 1, Blue: 2, Green: 3 };
    const reverseRow: Record<string, number> = { Yellow: 2, Red: 3, Blue: 4, Green: 5 };
    return cell(reverseCol[color], reverseRow[color]);
  }
  const row = NUMBER_ROWS[color];
  const col = NUMBER_START_COL[color] + TYPE_OFFSET[type];
  return cell(col, row);
}
