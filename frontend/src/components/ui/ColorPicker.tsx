"use client";

import { CardFace } from "@/components/ui/CardFace";

const COLORS = ["Red", "Yellow", "Green", "Blue"] as const;

export function ColorPicker({ onPick }: { onPick: (c: string) => void }) {
  return (
    <div className="color-picker-backdrop" role="dialog" aria-label="Choose a color">
      <div className="color-picker">
        <p className="color-picker-title">Choose a color</p>
        <div className="color-picker-tiles">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-picker-tile color-picker-tile--${c.toLowerCase()}`}
              aria-label={`Choose ${c}`}
              onClick={() => onPick(c)}
            >
              <CardFace color={c} type="Zero" size="lg" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
