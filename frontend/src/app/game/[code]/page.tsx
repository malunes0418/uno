"use client";

import { useParams } from "next/navigation";
import { useGameHub } from "@/hooks/useGameHub";
import { GameHubProvider } from "@/lib/hub/GameHubContext";
import { TableScene } from "@/lib/three/TableScene";
import { HudOverlay } from "@/components/ui/HudOverlay";

export default function GamePage() {
  const { code } = useParams<{ code: string }>();
  const hubRef = useGameHub(code);

  return (
    <GameHubProvider hubRef={hubRef}>
      <div className="game-shell">
        <TableScene />
        <HudOverlay />
      </div>
    </GameHubProvider>
  );
}
