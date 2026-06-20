"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useCardTexture } from "./CardTextureProvider";

type Props = {
  color: string;
  type: string;
  faceUp?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  opacity?: number;
  playable?: boolean;
  onClick?: () => void;
};

function applyPlayability(
  material: THREE.MeshStandardMaterial,
  playable: boolean | undefined,
) {
  if (playable === false) {
    material.color.setScalar(0.45);
    material.emissive.setHex(0x000000);
    material.emissiveIntensity = 0;
    return;
  }
  if (playable === true) {
    material.color.setRGB(1, 1, 1);
    material.emissive.setHex(0x1a5533);
    material.emissiveIntensity = 0.12;
  }
}

export function CardMesh({
  color,
  type,
  faceUp = true,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  opacity = 1,
  playable,
  onClick,
}: Props) {
  const { getMaterial } = useCardTexture();

  const material = useMemo(() => {
    const cached = getMaterial(faceUp, color, type);
    const needsClone = opacity !== 1 || playable !== undefined;
    if (!needsClone) return cached;

    const tinted = cached.clone();
    applyPlayability(tinted, playable);
    if (opacity !== 1) {
      tinted.opacity = opacity;
      tinted.transparent = true;
    }
    return tinted;
  }, [getMaterial, faceUp, color, type, opacity, playable]);

  useEffect(() => {
    if (opacity === 1 && playable === undefined) return;
    return () => {
      // Cloned materials share the cached texture map — do not dispose it.
      material.map = null;
      material.dispose();
    };
  }, [material, opacity, playable]);

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
