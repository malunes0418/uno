"use client";

import { Button } from "./Button";

export function ChallengePrompt({
  pendingDraw,
  onChallenge,
  onAccept,
}: {
  pendingDraw: number;
  onChallenge: () => void;
  onAccept: () => void;
}) {
  return (
    <div
      className="challenge-prompt"
      role="dialog"
      aria-label="Wild Draw Four challenge"
    >
      <p className="challenge-prompt-text">
        Opponent played Wild Draw Four (+{pendingDraw}). Challenge or accept?
      </p>
      <div className="challenge-prompt-actions">
        <Button onClick={onChallenge}>Challenge</Button>
        <Button variant="secondary" onClick={onAccept}>
          Accept
        </Button>
      </div>
    </div>
  );
}
