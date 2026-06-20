import { CardMesh } from "./CardMesh";
import type { CardDto } from "@/lib/hub/contract";

export function HandFan({
  cards,
  onSelect,
}: {
  cards: CardDto[];
  onSelect: (index: number) => void;
}) {
  const spread = 0.7;
  const start = -((cards.length - 1) * spread) / 2;
  return (
    <>
      {cards.map((c, i) => (
        <group
          key={i}
          position={[start + i * spread, 0.05, 3.2]}
          rotation={[-0.3, 0, (i - cards.length / 2) * 0.05]}
        >
          <CardMesh color={c.color} type={c.type} onClick={() => onSelect(i)} />
        </group>
      ))}
    </>
  );
}
