"use client";

import { useIsMobile } from "@/hooks/useMediaQuery";
import { CardMesh } from "./CardMesh";
import { useCardHover } from "./useCardHover";
import type { CardDto } from "@/lib/hub/contract";

const DESKTOP_SPREAD = 0.7;
const MOBILE_SPREAD = 0.42;
const DESKTOP_ROTATION = 0.05;
const MOBILE_ROTATION = 0.03;

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
  const isMobile = useIsMobile();
  const spread = isMobile ? MOBILE_SPREAD : DESKTOP_SPREAD;
  const rotationStep = isMobile ? MOBILE_ROTATION : DESKTOP_ROTATION;
  const start = -((cards.length - 1) * spread) / 2;
  return (
    <>
      {cards.map((c, i) => {
        const canPlay = playable.has(i);
        return (
          <group
            key={i}
            position={[start + i * spread, 0.05, 3.2]}
            rotation={[-0.3, 0, (i - cards.length / 2) * rotationStep]}
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
