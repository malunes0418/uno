"use client";

import { useGameStore } from "@/lib/store/gameStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import { HandFan } from "./HandFan";
import { DrawDiscardPiles } from "./DrawDiscardPiles";
import { OpponentRow } from "./OpponentRow";

export function SceneContent() {
  const state = useGameStore((s) => s.gameState);
  const playerId = usePlayerStore((s) => s.playerId);
  if (!state) return null;
  const me = state.players.find((p) => p.id === playerId);
  return (
    <>
      <DrawDiscardPiles topCard={state.topCard} drawCount={state.drawPileCount} />
      <OpponentRow players={state.players} viewerId={playerId} />
      {me?.hand && <HandFan cards={me.hand} onSelect={() => {}} />}
    </>
  );
}
