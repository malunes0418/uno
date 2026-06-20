"use client";

import { useGameStore } from "@/lib/store/gameStore";

export function Scoreboard() {
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
    </div>
  );
}
