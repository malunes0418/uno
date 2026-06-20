"use client";

import type { CardDto } from "@/lib/hub/contract";
import { CardFace } from "@/components/ui/CardFace";

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
    <div className="jump-in-highlight" role="toolbar" aria-label="Jump in">
      <span className="jump-in-label">Jump in!</span>
      <div className="jump-in-cards">
        {matches.map(({ card, index }) => (
          <button
            key={index}
            type="button"
            className="jump-in-card"
            aria-label={`Play ${card.color} ${card.type}`}
            onClick={() => onPlay(index)}
          >
            <CardFace color={card.color} type={card.type} size="md" />
          </button>
        ))}
      </div>
    </div>
  );
}
