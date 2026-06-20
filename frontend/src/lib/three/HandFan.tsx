"use client";

import { CardMesh } from "./CardMesh";
import { useCardHover } from "./useCardHover";
import type { CardDto } from "@/lib/hub/contract";

function FanCard({
  card,
  canPlay,
  onSelect,
}: {
  card: CardDto;
  canPlay: boolean;
  onSelect: () => void;
}) {
  const { groupRef, pointerHandlers } = useCardHover(canPlay);

  return (
    <group ref={groupRef} {...pointerHandlers}>
      <CardMesh
        color={card.color}
        type={card.type}
        playable={canPlay}
        onClick={canPlay ? onSelect : undefined}
      />
    </group>
  );
}

export function HandFan({
  cards,
  playable,
  onSelect,
}: {
  cards: CardDto[];
  playable: Set<number>;
  onSelect: (index: number) => void;
}) {
  const spread = 0.7;
  const start = -((cards.length - 1) * spread) / 2;
  return (
    <>
      {cards.map((c, i) => {
        const canPlay = playable.has(i);
        return (
          <group
            key={i}
            position={[start + i * spread, 0.05, 3.2]}
            rotation={[-0.3, 0, (i - cards.length / 2) * 0.05]}
          >
            <FanCard
              card={c}
              canPlay={canPlay}
              onSelect={() => onSelect(i)}
            />
          </group>
        );
      })}
    </>
  );
}
