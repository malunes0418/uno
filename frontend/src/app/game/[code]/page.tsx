"use client";

import { useCallback } from "react";
import { useAnimationQueue } from "@/lib/animation/useAnimationQueue";
import { useParams } from "next/navigation";
import { useGameHub } from "@/hooks/useGameHub";
import { GameHubProvider, useGameHubRef } from "@/lib/hub/GameHubContext";
import {
  callUno,
  catchUno,
  chooseColor,
  playCard,
} from "@/lib/hub/commandBuilders";
import type { CommandDto } from "@/lib/hub/contract";
import { useGameStore } from "@/lib/store/gameStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import { TableScene } from "@/lib/three/TableScene";
import { HudOverlay } from "@/components/ui/HudOverlay";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { UnoButton } from "@/components/ui/UnoButton";
import { CatchPrompt } from "@/components/ui/CatchPrompt";
import { JumpInHighlight } from "@/components/ui/JumpInHighlight";
import { Scoreboard } from "@/components/ui/Scoreboard";

function GameOverlays() {
  const state = useGameStore((s) => s.gameState);
  const playerId = usePlayerStore((s) => s.playerId);
  const hubRef = useGameHubRef();

  const send = useCallback(
    (command: CommandDto) => {
      const current = useGameStore.getState().gameState;
      const hub = hubRef.current;
      if (!current || !hub) return;
      void hub.sendCommand(current.roomCode, command, current.version);
    },
    [hubRef],
  );

  if (!state) return null;

  const me = state.players.find((p) => p.id === playerId);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;

  const showColorPicker =
    state.phase === "AwaitingColorChoice" &&
    state.pendingWildPlayerId === playerId;

  const showUnoButton =
    me != null && (me.handCount === 2 || me.hand?.length === 2);

  const catchTargets =
    state.rules.forcedUnoPenalty
      ? state.players.filter(
          (p) =>
            p.id !== playerId && p.handCount === 1 && !p.hasCalledUno,
        )
      : [];

  const showJumpIn =
    state.rules.jumpIn &&
    state.phase === "AwaitingPlay" &&
    state.pendingDraw === 0 &&
    !isMyTurn &&
    me?.hand != null;

  return (
    <>
      {showColorPicker && (
        <ColorPicker onPick={(color) => send(chooseColor(playerId, color))} />
      )}
      {showUnoButton && <UnoButton onCall={() => send(callUno(playerId))} />}
      <CatchPrompt
        targets={catchTargets.map((p) => ({ id: p.id, name: p.name }))}
        onCatch={(targetId) => send(catchUno(playerId, targetId))}
      />
      {showJumpIn && me.hand && (
        <JumpInHighlight
          hand={me.hand}
          topCard={state.topCard}
          onPlay={(index) => send(playCard(playerId, [index]))}
        />
      )}
    </>
  );
}

function AnimationRunner() {
  useAnimationQueue();
  return null;
}

export default function GamePage() {
  const { code } = useParams<{ code: string }>();
  const hubRef = useGameHub(code);

  return (
    <GameHubProvider hubRef={hubRef}>
      <AnimationRunner />
      <div className="game-shell">
        <TableScene />
        <HudOverlay />
        <GameOverlays />
        <Scoreboard />
      </div>
    </GameHubProvider>
  );
}
