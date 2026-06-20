"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/lib/store/playerStore";
import { GameHubClient } from "@/lib/hub/gameHubClient";
import { useGameStore } from "@/lib/store/gameStore";
import { Button } from "@/components/ui/Button";
import { RuleToggles } from "@/components/ui/RuleToggles";
import { TextField } from "@/components/ui/TextField";
import type { RuleSetDto } from "@/lib/hub/contract";

const defaultRules: RuleSetDto = {
  stacking: "None",
  drawToMatch: false,
  jumpIn: false,
  sevenZero: false,
  forcedUnoPenalty: false,
  sameNumberMultiPlay: false,
  cumulativeScoring: false,
  wildDrawFourChallenge: false,
};

export default function Home() {
  const router = useRouter();
  const { displayName, setDisplayName, ensurePlayerId, load } = usePlayerStore();
  const [joinCode, setJoinCode] = useState("");
  const [nameError, setNameError] = useState(false);
  const [rules, setRules] = useState(defaultRules);

  useEffect(() => {
    load();
  }, [load]);

  const requireName = () => {
    if (!displayName.trim()) {
      setNameError(true);
      return false;
    }
    setNameError(false);
    return true;
  };

  const createRoom = async () => {
    if (!requireName()) return;
    const hub = new GameHubClient();
    await hub.start();
    const playerId = ensurePlayerId();
    const { code } = await hub.createRoom(rules, displayName.trim(), playerId);
    useGameStore.getState().reset();
    router.push(`/lobby/${code}`);
  };

  const joinRoom = async () => {
    if (!requireName()) return;
    const hub = new GameHubClient();
    await hub.start();
    const playerId = ensurePlayerId();
    await hub.joinRoom(joinCode.trim().toUpperCase(), displayName.trim(), playerId);
    router.push(`/lobby/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <main className="home">
      <h1>UNO Classic</h1>
      <TextField
        placeholder="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      {nameError && <p>Enter your name</p>}
      <RuleToggles rules={rules} onChange={setRules} />
      <Button onClick={createRoom}>Create Room</Button>
      <TextField
        placeholder="Join code"
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value)}
      />
      <Button onClick={joinRoom}>Join</Button>
    </main>
  );
}
