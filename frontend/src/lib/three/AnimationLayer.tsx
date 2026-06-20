"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAnimationStore } from "@/lib/store/animationStore";
import { useGameStore } from "@/lib/store/gameStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import type { TweenDescriptor } from "@/lib/animation/animationQueue";
import type { ClientPlayerDto } from "@/lib/hub/contract";
import { CardMesh } from "./CardMesh";
import { PILE_POSITIONS, playerSeat } from "./playerSeat";

type ArcTween = Extract<TweenDescriptor, { kind: "playArc" }>;
type DrawTween = Extract<TweenDescriptor, { kind: "draw" }>;

const EMPTY_PLAYERS: ClientPlayerDto[] = [];

function arcPosition(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  const eased = t * (2 - t);
  return [
    THREE.MathUtils.lerp(from[0], to[0], eased),
    THREE.MathUtils.lerp(from[1], to[1], eased) + Math.sin(t * Math.PI) * 0.75,
    THREE.MathUtils.lerp(from[2], to[2], eased),
  ];
}

function PlayArcMesh({ tween }: { tween: ArcTween }) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef<number | null>(null);
  const players = useGameStore((s) => s.gameState?.players ?? EMPTY_PLAYERS);
  const viewerId = usePlayerStore((s) => s.playerId);
  const from = useMemo(
    () => playerSeat(tween.playerId, viewerId, players),
    [tween.playerId, viewerId, players],
  );
  const to = PILE_POSITIONS.discard;
  const card = tween.cards[tween.cards.length - 1];

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const now = state.clock.elapsedTime * 1000;
    if (startTime.current === null) startTime.current = now;
    const t = Math.min((now - startTime.current) / tween.durationMs, 1);
    const [x, y, z] = arcPosition(from, to, t);
    group.position.set(x, y, z);
  });

  return (
    <group ref={groupRef} data-testid="animation-play-arc">
      <CardMesh color={card.color} type={card.type} />
    </group>
  );
}

function DrawMesh({ tween }: { tween: DrawTween }) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef<number | null>(null);
  const players = useGameStore((s) => s.gameState?.players ?? EMPTY_PLAYERS);
  const viewerId = usePlayerStore((s) => s.playerId);
  const to = useMemo(
    () => playerSeat(tween.playerId, viewerId, players),
    [tween.playerId, viewerId, players],
  );
  const from = PILE_POSITIONS.draw;

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const now = state.clock.elapsedTime * 1000;
    if (startTime.current === null) startTime.current = now;
    const t = Math.min((now - startTime.current) / tween.durationMs, 1);
    const [x, y, z] = arcPosition(from, to, t);
    group.position.set(x, y, z);
  });

  return (
    <group ref={groupRef} data-testid="animation-draw">
      <CardMesh color="Red" type="Zero" faceUp={false} />
    </group>
  );
}

function ReverseStub() {
  // TODO: rotate direction indicator around the table
  return null;
}

function ColorBurstStub() {
  // TODO: radial color burst on wild color choice
  return null;
}

function UnoShoutStub() {
  // TODO: UNO badge pop above player seat
  return null;
}

function ActiveTweenMesh({ tween }: { tween: TweenDescriptor }) {
  switch (tween.kind) {
    case "playArc":
      return <PlayArcMesh tween={tween} />;
    case "draw":
      return <DrawMesh tween={tween} />;
    case "reverse":
      return <ReverseStub />;
    case "colorBurst":
      return <ColorBurstStub />;
    case "unoShout":
      return <UnoShoutStub />;
    default:
      return null;
  }
}

export function AnimationLayer() {
  const activeTween = useAnimationStore((s) => s.activeTween);
  if (!activeTween) return null;

  return (
    <group data-testid="animation-layer">
      <ActiveTweenMesh tween={activeTween} />
    </group>
  );
}
