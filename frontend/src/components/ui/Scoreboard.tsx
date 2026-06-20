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

export function Scoreboard() {
  const router = useRouter();
  const state = useGameStore((s) => s.gameState);
  if (!state || (state.phase !== "RoundOver" && state.phase !== "GameOver")) return null;

  const winner = winnerId(state);

  return (
    <div className="scoreboard">
      <h2>{state.phase === "GameOver" ? "Game Over" : "Round Over"}</h2>
      <ul>
        {state.players.map((p) => {
          const isWinner = p.id === winner;
          return (
            <li key={p.id} className={isWinner ? "scoreboard-winner" : undefined}>
              {isWinner && <CardFace color="Wild" type="Wild" size="sm" />}
              {p.name}: {p.score}
            </li>
          );
        })}
      </ul>
      <Button onClick={() => router.push("/")}>Play Again</Button>
    </div>
  );
}
