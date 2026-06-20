import { CardMesh } from "./CardMesh";
import type { CardDto } from "@/lib/hub/contract";

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
            <CardMesh
              color={c.color}
              type={c.type}
              opacity={canPlay ? 1 : 0.4}
              onClick={canPlay ? () => onSelect(i) : undefined}
            />
          </group>
        );
      })}
    </>
  );
}
