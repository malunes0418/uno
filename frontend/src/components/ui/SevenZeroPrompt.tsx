"use client";

import { Button } from "./Button";
import { DirectionBadge } from "./DirectionBadge";

type SwapProps = {
  variant: "swap";
  targets: { id: string; name: string }[];
  onSelect: (targetId: string) => void;
};

type RotateProps = {
  variant: "rotate";
  direction: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SevenZeroPrompt(props: SwapProps | RotateProps) {
  if (props.variant === "swap") {
    if (props.targets.length === 0) return null;

    return (
      <div
        className="seven-zero-prompt"
        role="dialog"
        aria-label="Choose player to swap hands"
      >
        <p className="seven-zero-prompt-text">Swap hands with:</p>
        <div className="seven-zero-prompt-actions">
          {props.targets.map((t) => (
            <Button key={t.id} onClick={() => props.onSelect(t.id)}>
              {t.name}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  const clockwise = props.direction > 0;
  const directionLabel = clockwise ? "clockwise" : "counter-clockwise";

  return (
    <div
      className="seven-zero-prompt"
      role="dialog"
      aria-label="Confirm hand rotation"
    >
      <p className="seven-zero-prompt-text">
        Play Zero — all hands rotate {directionLabel}
      </p>
      <DirectionBadge direction={props.direction} />
      <div className="seven-zero-prompt-actions">
        <Button onClick={props.onConfirm}>Confirm</Button>
        <Button variant="secondary" onClick={props.onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
