"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/lib/store/gameStore";
import { Button } from "@/components/ui/Button";

export function Scoreboard() {
  const router = useRouter();
  const state = useGameStore((s) => s.gameState);
  if (!state || (state.phase !== "RoundOver" && state.phase !== "GameOver")) return null;
  return (
    <div className="scoreboard">
      <h2>{state.phase === "GameOver" ? "Game Over" : "Round Over"}</h2>
      <ul>
        {state.players.map((p) => (
          <li key={p.id}>
            {p.name}: {p.score}
          </li>
        ))}
      </ul>
      <Button onClick={() => router.push("/")}>Play Again</Button>
    </div>
  );
}
