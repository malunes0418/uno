import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAnimationQueue } from "@/lib/animation/useAnimationQueue";
import { useAnimationStore } from "@/lib/store/animationStore";
import { useGameStore } from "@/lib/store/gameStore";

describe("useAnimationQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameStore.setState({
      room: null,
      gameState: null,
      eventQueue: [],
      error: null,
    });
    useAnimationStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dequeuesEventAndExposesActiveTween", () => {
    useGameStore.getState().enqueueEvents({
      events: [
        {
          type: "CardPlayed",
          playerId: "p1",
          cards: [{ color: "Red", type: "Five" }],
        },
      ],
    });

    const { result } = renderHook(() => useAnimationQueue());

    expect(result.current?.kind).toBe("playArc");
    expect(useGameStore.getState().eventQueue).toHaveLength(0);
    expect(useAnimationStore.getState().isAnimating).toBe(true);
  });

  it("clearsActiveTweenAfterDuration", () => {
    useGameStore.getState().enqueueEvents({
      events: [
        {
          type: "CardsDrawn",
          playerId: "p1",
          count: 1,
        },
      ],
    });

    renderHook(() => useAnimationQueue());
    expect(useAnimationStore.getState().activeTween?.kind).toBe("draw");

    act(() => {
      vi.runAllTimers();
    });

    expect(useAnimationStore.getState().activeTween).toBeNull();
    expect(useAnimationStore.getState().isAnimating).toBe(false);
  });
});
