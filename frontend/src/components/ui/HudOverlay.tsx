"use client";

import { useCallback, useEffect, useState } from "react";
import { CardFace } from "@/components/ui/CardFace";
import { ActiveColorChip } from "@/components/ui/ActiveColorChip";
import { DirectionBadge } from "@/components/ui/DirectionBadge";
import { TurnIndicator } from "@/components/ui/TurnIndicator";
import type { GameEventDto } from "@/lib/hub/contract";
import { useGameStore } from "@/lib/store/gameStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import styles from "./HudOverlay.module.css";

const TOAST_MS = 4000;

const PHASE_LABELS: Record<string, string | null> = {
  AwaitingPlay: null,
  AwaitingColorChoice: "Choosing color",
  AwaitingChallenge: "Challenge window",
  AwaitingSevenTarget: "Pick swap target",
  RoundOver: "Round over",
  GameOver: "Game over",
};

function drawStackCardType(topType: string | undefined): "DrawTwo" | "WildDrawFour" {
  return topType === "WildDrawFour" ? "WildDrawFour" : "DrawTwo";
}

function PendingDrawStack({ amount, topType }: { amount: number; topType?: string }) {
  const cardType = drawStackCardType(topType);
  const cardColor = cardType === "WildDrawFour" ? "Wild" : "Red";
  const layers = Math.min(3, Math.max(1, Math.ceil(amount / 2)));

  return (
    <div className={styles.drawStack} aria-label={`Draw stack: plus ${amount}`}>
      <div className={styles.drawStackCards}>
        {Array.from({ length: layers }, (_, i) => (
          <CardFace
            key={i}
            color={cardColor}
            type={cardType}
            size="sm"
            className={styles.drawStackCard}
          />
        ))}
      </div>
      <span className={styles.drawStackLabel}>+{amount}</span>
    </div>
  );
}

function useHudToast() {
  const playerId = usePlayerStore((s) => s.playerId);
  const hubError = useGameStore((s) => s.error);
  const setError = useGameStore((s) => s.setError);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback(
    (message: string) => {
      setToast(message);
      setError(null);
    },
    [setError],
  );

  useEffect(() => {
    if (hubError) setToast(hubError);
  }, [hubError]);

  useEffect(() => {
    let lastLen = useGameStore.getState().eventQueue.length;

    return useGameStore.subscribe((state) => {
      const queue = state.eventQueue;
      if (queue.length > lastLen) {
        const added = queue.slice(lastLen) as GameEventDto[];
        for (const ev of added) {
          if (ev.type === "CommandRejected" && ev.playerId === playerId) {
            showToast(ev.reason);
          }
        }
      }
      lastLen = queue.length;
    });
  }, [playerId, showToast]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return toast;
}

export function HudOverlay() {
  const state = useGameStore((s) => s.gameState);
  const playerId = usePlayerStore((s) => s.playerId);
  const toast = useHudToast();

  if (!state) {
    return toast ? (
      <div className={styles.overlay}>
        <div />
        <div className={styles.toast} role="alert">
          {toast}
        </div>
      </div>
    ) : null;
  }

  const current = state.players[state.currentPlayerIndex];
  const isYou = current?.id === playerId;
  const phaseLabel = PHASE_LABELS[state.phase] ?? state.phase;

  return (
    <div className={styles.overlay}>
      <div className={styles.topBar}>
        <TurnIndicator name={current?.name ?? "—"} isYou={isYou} />
        <DirectionBadge direction={state.direction} />
        <ActiveColorChip color={state.activeColor} topCardType={state.topCard.type} />
        {state.pendingDraw > 0 && (
          <PendingDrawStack amount={state.pendingDraw} topType={state.topCard.type} />
        )}
        {phaseLabel && (
          <span className={styles.phaseBadge} aria-live="polite">
            {phaseLabel}
          </span>
        )}
      </div>

      {toast && (
        <div className={styles.toast} role="alert">
          {toast}
        </div>
      )}
    </div>
  );
}
