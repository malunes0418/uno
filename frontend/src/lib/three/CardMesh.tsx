"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { uvForCard, uvForBack } from "@/lib/cards/cardAtlas";

type Props = {
  color: string;
  type: string;
  faceUp?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

export function CardMesh({
  color,
  type,
  faceUp = true,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: Props) {
  const baseTexture = useLoader(THREE.TextureLoader, "/uno_classic.png");

  const material = useMemo(() => {
    const uv = faceUp ? uvForCard(color, type) : uvForBack();
    const tex = baseTexture.clone();
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.offset.set(uv.u, uv.v);
    tex.repeat.set(uv.w, uv.h);
    tex.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
    });
  }, [baseTexture, color, type, faceUp]);

  useEffect(() => {
    return () => {
      material.map?.dispose();
      material.dispose();
    };
  }, [material]);

  return (
    <mesh position={position} rotation={rotation} material={material}>
      <planeGeometry args={[0.63, 0.88]} />
    </mesh>
  );
}
