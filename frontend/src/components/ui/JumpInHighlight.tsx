"use client";

import type { CardDto } from "@/lib/hub/contract";
import { Button } from "./Button";

function isIdentical(card: CardDto, top: CardDto): boolean {
  return card.color === top.color && card.type === top.type;
}

export function JumpInHighlight({
  hand,
  topCard,
  onPlay,
}: {
  hand: CardDto[];
  topCard: CardDto;
  onPlay: (index: number) => void;
}) {
  const matches = hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => isIdentical(card, topCard));

  if (matches.length === 0) return null;

  return (
    <div className="jump-in-highlight">
      <span className="jump-in-label">Jump in!</span>
      {matches.map(({ card, index }) => (
        <Button
          key={index}
          className="jump-in-card"
          onClick={() => onPlay(index)}
        >
          {card.color} {card.type}
        </Button>
      ))}
    </div>
  );
}
