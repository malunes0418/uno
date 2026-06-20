"use client";

import { useEffect, useRef } from "react";
import { GameHubClient } from "@/lib/hub/gameHubClient";
import { useGameStore } from "@/lib/store/gameStore";
import { usePlayerStore } from "@/lib/store/playerStore";

export function useGameHub(code: string) {
  const hubRef = useRef<GameHubClient | null>(null);
  const { ensurePlayerId, displayName } = usePlayerStore();

  useEffect(() => {
    const hub = new GameHubClient();
    hubRef.current = hub;
    hub.registerHandlers({
      onRoomUpdated: (r) => useGameStore.getState().setRoom(r),
      onGameStateUpdated: (s) => useGameStore.getState().applyState(s),
      onGameEvents: (b) => useGameStore.getState().enqueueEvents(b),
      onError: (m) => useGameStore.getState().setError(m),
    });
    (async () => {
      await hub.start();
      await hub.reconnect(code, ensurePlayerId(), displayName);
    })();
    return () => {
      hub.stop();
    };
  }, [code, displayName, ensurePlayerId]);

  return hubRef;
}
