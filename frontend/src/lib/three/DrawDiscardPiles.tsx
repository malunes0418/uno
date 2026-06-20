"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CardMesh } from "./CardMesh";
import { useCardTexture } from "./CardTextureProvider";
import { useGameStore } from "@/lib/store/gameStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import type { CardDto } from "@/lib/hub/contract";

function hashCard(card: CardDto): number {
  let h = 0;
  const key = `${card.color}:${card.type}`;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function discardRotation(card: CardDto): [number, number, number] {
  const h = hashCard(card);
  return [-0.3, ((h % 21) - 10) * 0.004, ((h % 17) - 8) * 0.005];
}

function DrawPileCard({
  position,
  highlighted,
  onClick,
}: {
  position: [number, number, number];
  highlighted: boolean;
  onClick?: () => void;
}) {
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const { getMaterial } = useCardTexture();

  const material = useMemo(() => {
    const cached = getMaterial(false, "Red", "Zero");
    const tinted = cached.clone();
    tinted.emissive.setHex(0x1a4466);
    tinted.emissiveIntensity = 0;
    materialRef.current = tinted;
    return tinted;
  }, [getMaterial]);

  useEffect(
    () => () => {
      material.map = null;
      material.dispose();
    },
    [material],
  );

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.emissiveIntensity = highlighted
      ? 0.06 + Math.sin(clock.elapsedTime * 3.2) * 0.07
      : 0;
  });

  return (
    <mesh
      position={position}
      material={material}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
    >
      <planeGeometry args={[0.63, 0.88]} />
    </mesh>
  );
}

export function DrawDiscardPiles({
  topCard,
  drawCount,
  onDraw,
}: {
  topCard: CardDto;
  drawCount: number;
  onDraw?: () => void;
}) {
  const playerId = usePlayerStore((s) => s.playerId);
  const isMyTurn = useGameStore((s) => {
    const state = s.gameState;
    if (!state) return false;
    return state.players[state.currentPlayerIndex]?.id === playerId;
  });

  const stackLayers = Math.min(Math.max(drawCount, 1), 5);
  const topDiscardRotation = useMemo(() => discardRotation(topCard), [topCard]);

  return (
    <group>
      {Array.from({ length: stackLayers }, (_, i) => {
        const position: [number, number, number] = [
          -0.8,
          0.05 + i * 0.002,
          -i * 0.03,
        ];
        const isTop = i === stackLayers - 1;

        if (isTop) {
          return (
            <DrawPileCard
              key={i}
              position={position}
              highlighted={isMyTurn}
              onClick={onDraw}
            />
          );
        }

        return (
          <CardMesh
            key={i}
            color="Red"
            type="Zero"
            faceUp={false}
            position={position}
          />
        );
      })}
      <CardMesh
        color={topCard.color}
        type={topCard.type}
        position={[0.8, 0.05, 0]}
        rotation={topDiscardRotation}
      />
    </group>
  );
}
