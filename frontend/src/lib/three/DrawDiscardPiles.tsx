import { CardMesh } from "./CardMesh";
import type { CardDto } from "@/lib/hub/contract";

export function DrawDiscardPiles({
  topCard,
  drawCount,
}: {
  topCard: CardDto;
  drawCount: number;
}) {
  const stackLayers = Math.min(Math.max(drawCount, 1), 5);

  return (
    <group>
      {Array.from({ length: stackLayers }, (_, i) => (
        <CardMesh
          key={i}
          color="Red"
          type="Zero"
          faceUp={false}
          position={[-0.8, 0.05 + i * 0.002, -i * 0.03]}
        />
      ))}
      <CardMesh
        color={topCard.color}
        type={topCard.type}
        position={[0.8, 0.05, 0]}
      />
    </group>
  );
}
