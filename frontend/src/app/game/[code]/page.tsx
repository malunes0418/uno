"use client";

import { useParams } from "next/navigation";
import { useGameHub } from "@/hooks/useGameHub";
import { TableScene } from "@/lib/three/TableScene";
import { HudOverlay } from "@/components/ui/HudOverlay";

export default function GamePage() {
  const { code } = useParams<{ code: string }>();
  useGameHub(code);

  return (
    <div className="game-shell">
      <TableScene />
      <HudOverlay />
    </div>
  );
}
