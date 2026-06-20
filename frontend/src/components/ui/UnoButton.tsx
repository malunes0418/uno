"use client";

import { Button } from "./Button";

export function UnoButton({ onCall }: { onCall: () => void }) {
  return (
    <div className="uno-button">
      <Button onClick={onCall}>UNO!</Button>
    </div>
  );
}
