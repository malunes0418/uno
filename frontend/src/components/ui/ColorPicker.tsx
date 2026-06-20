"use client";

const COLORS = ["Red", "Yellow", "Green", "Blue"] as const;

export function ColorPicker({ onPick }: { onPick: (c: string) => void }) {
  return (
    <div className="color-picker">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={`swatch ${c.toLowerCase()}`}
          onClick={() => onPick(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
