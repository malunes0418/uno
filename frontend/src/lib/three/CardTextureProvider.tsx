"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { CARD_ATLAS_URL, uvForBack, uvForCard } from "@/lib/cards/cardAtlas";

type MaterialCache = Map<string, THREE.MeshStandardMaterial>;

type CardTextureContextValue = {
  getMaterial: (
    faceUp: boolean,
    color: string,
    type: string,
  ) => THREE.MeshStandardMaterial;
};

const CardTextureContext = createContext<CardTextureContextValue | null>(null);

function materialKey(faceUp: boolean, color: string, type: string) {
  return `${faceUp ? "1" : "0"}|${color}|${type}`;
}

function createCardMaterial(
  baseTexture: THREE.Texture,
  faceUp: boolean,
  color: string,
  type: string,
): THREE.MeshStandardMaterial {
  const uv = faceUp ? uvForCard(color, type) : uvForBack();
  const tex = baseTexture.clone();
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.offset.set(uv.u, uv.v);
  tex.repeat.set(uv.w, uv.h);
  tex.needsUpdate = true;
  return new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    opacity: 1,
  });
}

export function CardTextureProvider({ children }: { children: ReactNode }) {
  const baseTexture = useLoader(THREE.TextureLoader, CARD_ATLAS_URL);
  const cacheRef = useRef<MaterialCache>(new Map());

  const value = useMemo<CardTextureContextValue>(
    () => ({
      getMaterial(faceUp, color, type) {
        const key = materialKey(faceUp, color, type);
        let material = cacheRef.current.get(key);
        if (!material) {
          material = createCardMaterial(baseTexture, faceUp, color, type);
          cacheRef.current.set(key, material);
        }
        return material;
      },
    }),
    [baseTexture],
  );

  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      for (const material of cache.values()) {
        material.map?.dispose();
        material.dispose();
      }
      cache.clear();
    };
  }, []);

  return (
    <CardTextureContext.Provider value={value}>
      {children}
    </CardTextureContext.Provider>
  );
}

export function useCardTexture() {
  const ctx = useContext(CardTextureContext);
  if (!ctx) {
    throw new Error("useCardTexture must be used within CardTextureProvider");
  }
  return ctx;
}
