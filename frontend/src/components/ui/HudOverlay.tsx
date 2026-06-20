"use client";

import { useGameStore } from "@/lib/store/gameStore";

export function HudOverlay() {
  const state = useGameStore((s) => s.gameState);
  const error = useGameStore((s) => s.error);
  if (!state) return error ? <div className="hud">{error}</div> : null;

  const current = state.players[state.currentPlayerIndex];

  return (
    <div className="hud">
      <span>Turn: {current?.name ?? "—"}</span>
      <span>Color: {state.activeColor}</span>
      <span>Direction: {state.direction > 0 ? "CW" : "CCW"}</span>
      {state.pendingDraw > 0 && <span>Draw stack: +{state.pendingDraw}</span>}
      {error && <span>{error}</span>}
    </div>
  );
}
