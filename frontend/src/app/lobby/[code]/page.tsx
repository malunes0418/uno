"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameHubClient } from "@/lib/hub/gameHubClient";
import type { RuleSetDto } from "@/lib/hub/contract";
import { useGameStore } from "@/lib/store/gameStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Button } from "@/components/ui/Button";
import { CardFace } from "@/components/ui/CardFace";
import { PlayerList } from "@/components/ui/PlayerList";
import styles from "../lobby.module.css";

const BOOL_RULE_LABELS: { key: keyof RuleSetDto; label: string }[] = [
  { key: "drawToMatch", label: "Draw to match" },
  { key: "jumpIn", label: "Jump-in" },
  { key: "sevenZero", label: "Seven-Zero" },
  { key: "forcedUnoPenalty", label: "Forced UNO penalty" },
  { key: "sameNumberMultiPlay", label: "Same number multi-play" },
  { key: "cumulativeScoring", label: "Cumulative scoring" },
  { key: "wildDrawFourChallenge", label: "Wild Draw Four challenge" },
];

const STACKING_LABELS: Record<RuleSetDto["stacking"], string> = {
  None: "No stacking",
  SameType: "Same-type stacking",
  TwoAndFourInterchangeable: "+2/+4 interchangeable",
};

function ruleSummaryChips(rules: RuleSetDto): string[] {
  const chips = [STACKING_LABELS[rules.stacking]];
  for (const { key, label } of BOOL_RULE_LABELS) {
    if (rules[key]) chips.push(label);
  }
  return chips;
}

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const room = useGameStore((s) => s.room);
  const error = useGameStore((s) => s.error);
  const { playerId, displayName, ensurePlayerId } = usePlayerStore();
  const hubRef = useRef<GameHubClient | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const hub = new GameHubClient();
    hubRef.current = hub;
    hub.registerHandlers({
      onRoomUpdated: (r) => {
        useGameStore.getState().setRoom(r);
        if (r.status === "InGame") router.push(`/game/${code}`);
      },
      onGameStateUpdated: () => {},
      onGameEvents: () => {},
      onError: (m) => useGameStore.getState().setError(m),
    });
    (async () => {
      await hub.start();
      await hub.reconnect(code, ensurePlayerId(), displayName);
    })();
    return () => {
      void hub.stop();
    };
  }, [code, displayName, ensurePlayerId, router]);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [code]);

  const isHost = room?.hostId === playerId;
  const ruleChips = room ? ruleSummaryChips(room.rules) : [];

  return (
    <main className={styles.lobby}>
      <div className={`app-shell ${styles.shell}`}>
        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <header className={styles.header}>
          <p className={styles.eyebrow}>Waiting room</p>
          <h1 className={styles.title}>
            <span className={styles.titleAccent}>UNO</span> Lobby
          </h1>
          <div className={styles.roomCodeBlock}>
            <span className={styles.roomCodeLabel}>Share this code</span>
            <div className={styles.roomCodeRow}>
              <code className={styles.roomCode} aria-label="Room code">
                {code}
              </code>
              <button
                type="button"
                className={styles.copyButton}
                onClick={() => void copyCode()}
                aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </header>

        {!room ? (
          <section
            className={`page-card ${styles.loadingCard}`}
            aria-label="Connecting to room"
            aria-busy="true"
          >
            <div className={styles.waitingCards} aria-hidden>
              <CardFace faceUp={false} size="sm" className={styles.waitCard1} />
              <CardFace faceUp={false} size="sm" className={styles.waitCard2} />
              <CardFace faceUp={false} size="sm" className={styles.waitCard3} />
            </div>
            <p className={styles.loadingText}>Joining the table…</p>
          </section>
        ) : (
          <>
            <section
              className={`page-card ${styles.playersCard}`}
              aria-label="Players"
            >
              <h2 className={styles.sectionTitle}>Players ({room.players.length})</h2>
              <PlayerList players={room.players} hostId={room.hostId} />
            </section>

            <section className={styles.rulesSection} aria-label="House rules">
              <h2 className={styles.sectionTitle}>House rules</h2>
              <div className={styles.ruleChips}>
                {ruleChips.map((chip) => (
                  <span key={chip} className={styles.ruleChip}>
                    {chip}
                  </span>
                ))}
              </div>
            </section>

            {isHost ? (
              <div className={styles.hostActions}>
                <Button
                  variant="secondary"
                  onClick={() => hubRef.current?.addBot(code)}
                >
                  Add Bot
                </Button>
                <Button onClick={() => hubRef.current?.startGame(code)}>
                  Start Game
                </Button>
              </div>
            ) : (
              <p className={styles.waitingHint}>Waiting for the host to start…</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
