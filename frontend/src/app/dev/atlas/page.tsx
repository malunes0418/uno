import { notFound } from "next/navigation";
import {
  CARD_ATLAS_URL,
  atlasBackgroundStyleFromUv,
  uvForBack,
  uvForCard,
} from "@/lib/cards/cardAtlas";
import styles from "@/components/ui/CardFace.module.css";

const COLS = 12;
const ROWS = 6;

const ENGINE_CARDS: Array<{ color: string; type: string; label: string }> = [
  ...(["Yellow", "Red", "Blue", "Green"] as const).flatMap((color) =>
    ([
      "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
      "Zero", "DrawTwo", "Skip", "Reverse",
    ] as const).map((type) => ({ color, type, label: `${color} ${type}` })),
  ),
  { color: "Wild", type: "Wild", label: "Wild" },
  { color: "Wild", type: "WildDrawFour", label: "WD4" },
];

function cellKey(col: number, row: number) {
  return `${row},${col}`;
}

function buildCellOwners(): Map<string, string> {
  const map = new Map<string, string>();
  map.set(cellKey(0, 0), "back");

  for (const { color, type, label } of ENGINE_CARDS) {
    const uv = uvForCard(color, type);
    const col = Math.round(uv.u / uv.w);
    const row = Math.round((1 - uv.v - uv.h) / uv.h);
    map.set(cellKey(col, row), label);
  }

  return map;
}

function uvForCell(col: number, row: number) {
  const cw = 1 / COLS;
  const ch = 1 / ROWS;
  return { u: col * cw, v: 1 - (row + 1) * ch, w: cw, h: ch };
}

export default function AtlasDevPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const cellOwners = buildCellOwners();

  return (
    <main style={{ padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Card Atlas — uno_classic.png</h1>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        12×6 grid labeled by (row, col). Dev-only — returns 404 in production.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gap: "4px",
          maxWidth: "960px",
        }}
      >
        {Array.from({ length: ROWS }, (_, row) =>
          Array.from({ length: COLS }, (_, col) => {
            const coord = cellKey(col, row);
            const owner = cellOwners.get(coord);
            const atlasStyle = owner === "back"
              ? atlasBackgroundStyleFromUv(uvForBack())
              : atlasBackgroundStyleFromUv(uvForCell(col, row));

            return (
              <div
                key={coord}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <div
                  className={`${styles.card} ${styles.sm}`}
                  style={{
                    backgroundImage: `url(${CARD_ATLAS_URL})`,
                    ...atlasStyle,
                    width: "72px",
                    height: "108px",
                    opacity: owner || row === 0 || row < 5 || col < 4 ? 1 : 0.25,
                  }}
                />
                <span style={{ fontSize: "10px", textAlign: "center", lineHeight: 1.2, whiteSpace: "pre-wrap" }}>
                  {coord}
                  {"\n"}
                  {owner ?? "—"}
                </span>
              </div>
            );
          }),
        )}
      </div>
    </main>
  );
}
