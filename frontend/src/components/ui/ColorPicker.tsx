"use client";

import { CardFace } from "@/components/ui/CardFace";

const COLORS = ["Red", "Yellow", "Green", "Blue"] as const;

export function ColorPicker({ onPick }: { onPick: (c: string) => void }) {
  return (
    <div className="color-picker">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className="color-picker-swatch"
          aria-label={`Choose ${c}`}
          onClick={() => onPick(c)}
        >
          <CardFace color={c} type="Zero" size="sm" />
        </button>
      ))}
    </div>
  );
}
