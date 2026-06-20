"use client";

import { Button } from "./Button";

export function CatchPrompt({
  targets,
  onCatch,
}: {
  targets: { id: string; name: string }[];
  onCatch: (targetId: string) => void;
}) {
  if (targets.length === 0) return null;

  return (
    <div className="catch-prompt">
      {targets.map((t) => (
        <Button key={t.id} onClick={() => onCatch(t.id)}>
          Catch {t.name}!
        </Button>
      ))}
    </div>
  );
}
