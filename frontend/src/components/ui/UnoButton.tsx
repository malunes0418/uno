"use client";

export function UnoButton({ onCall }: { onCall: () => void }) {
  return (
    <div className="uno-button">
      <button type="button" className="uno-button-pill" onClick={onCall} aria-label="Call UNO">
        UNO!
      </button>
    </div>
  );
}
