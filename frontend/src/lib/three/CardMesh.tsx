"use client";

import { useEffect, useMemo } from "react";
import { useCardTexture } from "./CardTextureProvider";

type Props = {
  color: string;
  type: string;
  faceUp?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  opacity?: number;
  onClick?: () => void;
};

export function CardMesh({
  color,
  type,
  faceUp = true,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  opacity = 1,
  onClick,
}: Props) {
  const { getMaterial } = useCardTexture();

  const material = useMemo(() => {
    const cached = getMaterial(faceUp, color, type);
    if (opacity === 1) return cached;
    const tinted = cached.clone();
    tinted.opacity = opacity;
    tinted.transparent = true;
    return tinted;
  }, [getMaterial, faceUp, color, type, opacity]);

  useEffect(() => {
    if (opacity === 1) return;
    return () => {
      material.dispose();
    };
  }, [material, opacity]);

  return (
    <mesh
      position={position}
      rotation={rotation}
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
