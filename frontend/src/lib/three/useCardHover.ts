"use client";

import { useCallback, useEffect, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

const HOVER_LIFT_Y = 0.15;
const HOVER_FORWARD_Z = 0.08;
const HOVER_LERP = 0.15;
const SELECTED_SCALE = 1.05;

export function useCardHover(playable: boolean) {
  const reducedMotion = usePrefersReducedMotion();
  const groupRef = useRef<THREE.Group>(null);
  const targetY = useRef(0);
  const targetZ = useRef(0);
  const targetScale = useRef(1);
  const selected = useRef(false);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const lerpSpeed = reducedMotion ? 0.45 : HOVER_LERP;
    const lerpFactor = 1 - Math.pow(1 - lerpSpeed, delta * 60);
    group.position.y = THREE.MathUtils.lerp(group.position.y, targetY.current, lerpFactor);
    group.position.z = THREE.MathUtils.lerp(group.position.z, targetZ.current, lerpFactor);
    const scale = THREE.MathUtils.lerp(group.scale.x, targetScale.current, lerpFactor);
    group.scale.setScalar(scale);
  });

  useEffect(() => {
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  const setCursor = useCallback(
    (pointer: boolean) => {
      if (playable) {
        document.body.style.cursor = pointer ? "pointer" : "";
      }
    },
    [playable],
  );

  const onPointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!playable) return;
      setCursor(true);
      if (!reducedMotion) {
        targetY.current = HOVER_LIFT_Y;
        targetZ.current = HOVER_FORWARD_Z;
      }
    },
    [playable, reducedMotion, setCursor],
  );

  const onPointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setCursor(false);
      targetY.current = 0;
      targetZ.current = 0;
      if (!selected.current) {
        targetScale.current = 1;
      }
    },
    [setCursor],
  );

  const onPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (!playable) return;
      selected.current = true;
      targetScale.current = SELECTED_SCALE;
    },
    [playable],
  );

  const onPointerUp = useCallback(() => {
    selected.current = false;
    targetScale.current = 1;
  }, []);

  return {
    groupRef,
    pointerHandlers: playable
      ? { onPointerOver, onPointerOut, onPointerDown, onPointerUp }
      : {},
  };
}
