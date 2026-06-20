import { describe, it, expect } from "vitest";
import { useGameStore } from "@/lib/store/gameStore";

describe("gameStore", () => {
  it("applyState_replacesAuthoritativeSnapshot", () => {
    const state = { version: 5 } as never;
    useGameStore.getState().applyState(state);
    expect(useGameStore.getState().gameState?.version).toBe(5);
  });

  it("enqueueEvents_appendsToQueue", () => {
    useGameStore.getState().enqueueEvents({ version: 1, events: [{ type: "UnoCalled", playerId: "p1" }] });
    expect(useGameStore.getState().eventQueue).toHaveLength(1);
  });
});
