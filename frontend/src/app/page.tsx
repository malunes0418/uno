"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/lib/store/playerStore";
import { GameHubClient } from "@/lib/hub/gameHubClient";
import { useGameStore } from "@/lib/store/gameStore";
import { Button } from "@/components/ui/Button";
import { CardFace } from "@/components/ui/CardFace";
import { RuleToggles } from "@/components/ui/RuleToggles";
import { TextField } from "@/components/ui/TextField";
import type { RuleSetDto } from "@/lib/hub/contract";
import styles from "./home.module.css";

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
    <main className={styles.home}>
      <div className={`app-shell ${styles.shell}`}>
        <section className={styles.hero} aria-label="Welcome">
          <h1 className={styles.title}>
            <span className={styles.titleAccent}>UNO</span> Classic
          </h1>
          <p className={styles.tagline}>
            Deal in, stack wilds, and race to empty your hand — online with friends.
          </p>
          <div className={styles.cardFan} aria-hidden>
            <CardFace />
            <CardFace />
            <CardFace />
          </div>
        </section>

        <section className={`page-card ${styles.formCard}`} aria-label="Create or join a room">
          <div className={styles.section}>
            <label className={styles.fieldLabel} htmlFor="display-name">
              Display name
            </label>
            <TextField
              id="display-name"
              placeholder="Your name at the table"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (nameError && e.target.value.trim()) setNameError(false);
              }}
              className={nameError ? styles.inputError : undefined}
              aria-invalid={nameError}
              aria-describedby={nameError ? "name-error" : undefined}
            />
            {nameError && (
              <span id="name-error" className={styles.errorMessage} role="alert">
                Enter your name
              </span>
            )}
          </div>

          <details className={`${styles.rulesSection} ${styles.rulesCollapse}`}>
            <summary className={styles.rulesToggle}>House rules</summary>
            <div className={styles.rulesContent}>
              <RuleToggles rules={rules} onChange={setRules} />
            </div>
          </details>

          <div className={styles.roomActions}>
            <Button className={styles.actionButton} onClick={createRoom}>
              Create Room
            </Button>
            <div className={styles.joinGroup}>
              <label className={styles.fieldLabel} htmlFor="join-code">
                Join with code
              </label>
              <TextField
                id="join-code"
                placeholder="ABCD"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <Button
                variant="secondary"
                className={styles.actionButton}
                onClick={joinRoom}
              >
                Join
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
