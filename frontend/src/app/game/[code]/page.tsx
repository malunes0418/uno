"use client";

import { useCallback } from "react";
import { useAnimationQueue } from "@/lib/animation/useAnimationQueue";
import { useParams } from "next/navigation";
import { useGameHub } from "@/hooks/useGameHub";
import { GameHubProvider, useGameHubRef } from "@/lib/hub/GameHubContext";
import {
  callUno,
  catchUno,
  challenge,
  chooseColor,
  chooseSevenSwapTarget,
  drawCard,
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
import { ChallengePrompt } from "@/components/ui/ChallengePrompt";
import { SevenZeroPrompt } from "@/components/ui/SevenZeroPrompt";

function GameOverlays() {
  const state = useGameStore((s) => s.gameState);
  const pendingZeroHandIndex = useGameStore((s) => s.pendingZeroHandIndex);
  const setPendingZeroHandIndex = useGameStore((s) => s.setPendingZeroHandIndex);
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

  const showChallenge =
    state.phase === "AwaitingChallenge" &&
    state.rules.wildDrawFourChallenge &&
    isMyTurn;

  const showSevenSwap =
    state.phase === "AwaitingSevenTarget" &&
    state.rules.sevenZero &&
    state.pendingWildPlayerId === playerId;

  const sevenSwapTargets = state.players
    .filter((p) => p.id !== playerId)
    .map((p) => ({ id: p.id, name: p.name }));

  const showSevenRotate =
    pendingZeroHandIndex !== null && state.rules.sevenZero;

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
      {showChallenge && (
        <ChallengePrompt
          pendingDraw={state.pendingDraw}
          onChallenge={() => send(challenge(playerId))}
          onAccept={() => send(drawCard(playerId))}
        />
      )}
      {showSevenSwap && (
        <SevenZeroPrompt
          variant="swap"
          targets={sevenSwapTargets}
          onSelect={(targetId) =>
            send(chooseSevenSwapTarget(playerId, targetId))
          }
        />
      )}
      {showSevenRotate && (
        <SevenZeroPrompt
          variant="rotate"
          direction={state.direction}
          onConfirm={() => {
            send(playCard(playerId, [pendingZeroHandIndex]));
            setPendingZeroHandIndex(null);
          }}
          onCancel={() => setPendingZeroHandIndex(null)}
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
