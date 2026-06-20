"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store/gameStore";
import { Button } from "@/components/ui/Button";
import { CardFace } from "@/components/ui/CardFace";
import type { ClientGameStateDto } from "@/lib/hub/contract";

function winnerId(state: ClientGameStateDto): string | null {
  if (state.phase === "GameOver") {
    const leader = [...state.players].sort((a, b) => b.score - a.score)[0];
    return leader?.id ?? null;
  }
  return state.players.find((p) => p.handCount === 0)?.id ?? null;
}

const CONFETTI_COUNT = 28;

function ScoreboardConfetti() {
  return (
    <div className="scoreboard-confetti" aria-hidden>
      {Array.from({ length: CONFETTI_COUNT }, (_, i) => (
        <span key={i} className="scoreboard-confetti-piece" style={{ "--i": i }} />
      ))}
    </div>
  );
}

export function Scoreboard() {
  const router = useRouter();
  const state = useGameStore((s) => s.gameState);
  if (!state || (state.phase !== "RoundOver" && state.phase !== "GameOver")) return null;

  const winner = winnerId(state);
  const ranked = [...state.players].sort((a, b) => b.score - a.score);
  const isGameOver = state.phase === "GameOver";

  return (
    <div className="scoreboard-backdrop">
      {isGameOver && <ScoreboardConfetti />}
      <div className="scoreboard-modal" role="dialog" aria-labelledby="scoreboard-title">
        <h2 id="scoreboard-title" className="scoreboard-title">
          {isGameOver ? "Game Over" : "Round Over"}
        </h2>
        <ol className="scoreboard-list">
          {ranked.map((p, index) => {
            const isWinner = p.id === winner;
            return (
              <li
                key={p.id}
                className={isWinner ? "scoreboard-row scoreboard-winner" : "scoreboard-row"}
              >
                <span className="scoreboard-rank">{index + 1}</span>
                <span className="scoreboard-trophy">
                  {isWinner && <CardFace color="Wild" type="Wild" size="sm" />}
                </span>
                <span className="scoreboard-name">{p.name}</span>
                <span className="scoreboard-score">{p.score}</span>
              </li>
            );
          })}
        </ol>
        <Button variant="primary" className="scoreboard-play-again" onClick={() => router.push("/")}>
          Play Again
        </Button>
      </div>
    </div>
  );
}
