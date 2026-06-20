"use client";

import { useCallback } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import { playableIndexes } from "@/lib/cards/playability";
import { playCard, drawCard } from "@/lib/hub/commandBuilders";
import { useGameHubRef } from "@/lib/hub/GameHubContext";
import { HandFan } from "./HandFan";
import { DrawDiscardPiles } from "./DrawDiscardPiles";
import { OpponentRow } from "./OpponentRow";
import { AnimationLayer } from "./AnimationLayer";

export function SceneContent() {
  const state = useGameStore((s) => s.gameState);
  const playerId = usePlayerStore((s) => s.playerId);
  const hubRef = useGameHubRef();

  const handlePlay = useCallback(
    (index: number) => {
      const current = useGameStore.getState().gameState;
      const hub = hubRef.current;
      if (!current || !hub) return;

      const me = current.players.find((p) => p.id === playerId);
      const card = me?.hand?.[index];
      if (
        current.rules.sevenZero &&
        card?.type === "Zero" &&
        me?.hand &&
        me.hand.length > 1
      ) {
        useGameStore.getState().setPendingZeroHandIndex(index);
        return;
      }

      void hub.sendCommand(
        current.roomCode,
        playCard(playerId, [index]),
        current.version,
      );
    },
    [hubRef, playerId],
  );

  const handleDraw = useCallback(() => {
    const current = useGameStore.getState().gameState;
    const hub = hubRef.current;
    if (!current || !hub) return;
    void hub.sendCommand(current.roomCode, drawCard(playerId), current.version);
  }, [hubRef, playerId]);

  if (!state) return null;
  const me = state.players.find((p) => p.id === playerId);
  const playable = playableIndexes(state, playerId);

  return (
    <>
      <AnimationLayer />
      <DrawDiscardPiles
        topCard={state.topCard}
        drawCount={state.drawPileCount}
        onDraw={handleDraw}
      />
      <OpponentRow players={state.players} viewerId={playerId} />
      {me?.hand && (
        <HandFan cards={me.hand} playable={playable} onSelect={handlePlay} />
      )}
    </>
  );
}
