"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { GameHubClient } from "@/lib/hub/gameHubClient";
import { useGameStore } from "@/lib/store/gameStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Button } from "@/components/ui/Button";
import { CardFace } from "@/components/ui/CardFace";

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const room = useGameStore((s) => s.room);
  const { playerId, displayName, ensurePlayerId } = usePlayerStore();
  const hubRef = useRef<GameHubClient | null>(null);

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

  const isHost = room?.hostId === playerId;

  return (
    <main>
      <h1>Room {code}</h1>
      <ul>
        {room?.players.map((p) => (
          <li key={p.id}>
            <CardFace faceUp={false} size="sm" />
            {p.name}
            {p.isBot ? " (bot)" : ""}
          </li>
        ))}
      </ul>
      {isHost && (
        <>
          <Button onClick={() => hubRef.current?.addBot(code)}>Add Bot</Button>
          <Button onClick={() => hubRef.current?.startGame(code)}>
            Start Game
          </Button>
        </>
      )}
    </main>
  );
}
