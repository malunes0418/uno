"use client";
import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { eventToTween, type TweenDescriptor } from "./animationQueue";

export function useAnimationQueue(onDone: () => void) {
  const [active, setActive] = useState<TweenDescriptor | null>(null);

  useEffect(() => {
    if (active) return;
    const ev = useGameStore.getState().dequeueEvent();
    if (!ev) return;
    const tween = eventToTween(ev);
    setActive(tween);
    const t = setTimeout(() => { setActive(null); onDone(); }, tween.durationMs);
    return () => clearTimeout(t);
  }, [active, onDone]);

  return active;
}
