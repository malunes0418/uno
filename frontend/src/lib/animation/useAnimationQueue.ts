"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useGameStore } from "@/lib/store/gameStore";
import { useAnimationStore } from "@/lib/store/animationStore";
import { eventToTween } from "./animationQueue";
import { scaleDuration } from "./motion";

function finishTween() {
  const animation = useAnimationStore.getState();
  animation.setActiveTween(null);
  animation.setAnimating(false);
  useGameStore.getState().commitPendingState();
}

export function useAnimationQueue() {
  const reducedMotion = usePrefersReducedMotion();
  const activeTween = useAnimationStore((s) => s.activeTween);
  const queueLength = useGameStore((s) => s.eventQueue.length);
  const setActiveTween = useAnimationStore((s) => s.setActiveTween);
  const setAnimating = useAnimationStore((s) => s.setAnimating);

  useEffect(() => {
    if (activeTween) return;

    const ev = useGameStore.getState().dequeueEvent();
    if (!ev) return;

    const tween = eventToTween(ev);
    if (tween.kind === "noop" && tween.durationMs === 0) return;

    const scaled = {
      ...tween,
      durationMs: scaleDuration(tween.durationMs, reducedMotion),
    };

    setActiveTween(scaled);
    setAnimating(scaled.durationMs > 0);
  }, [activeTween, queueLength, reducedMotion, setActiveTween, setAnimating]);

  useEffect(() => {
    if (!activeTween) return;
    const timer = setTimeout(finishTween, activeTween.durationMs);
    return () => clearTimeout(timer);
  }, [activeTween]);

  return activeTween;
}
