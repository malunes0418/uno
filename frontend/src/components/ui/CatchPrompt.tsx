"use client";

export function CatchPrompt({
  targets,
  onCatch,
}: {
  targets: { id: string; name: string }[];
  onCatch: (targetId: string) => void;
}) {
  if (targets.length === 0) return null;

  return (
    <aside className="catch-prompt" role="dialog" aria-label="Catch UNO">
      <p className="catch-prompt-title">Catch!</p>
      <div className="catch-prompt-targets">
        {targets.map((t) => (
          <button
            key={t.id}
            type="button"
            className="catch-prompt-target"
            onClick={() => onCatch(t.id)}
          >
            {t.name}
          </button>
        ))}
      </div>
    </aside>
  );
}
