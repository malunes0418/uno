import styles from "./HudOverlay.module.css";

type DirectionBadgeProps = {
  direction: number;
};

export function DirectionBadge({ direction }: DirectionBadgeProps) {
  const clockwise = direction > 0;
  const label = clockwise ? "Clockwise" : "Counter-clockwise";

  return (
    <div className={styles.directionBadge} aria-label={`Direction: ${label}`} title={label}>
      <svg
        className={[styles.directionArrow, clockwise ? "" : styles.directionArrowReverse]
          .filter(Boolean)
          .join(" ")}
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden
      >
        <path
          d="M12 4V1L8 5l4 4V6a6 6 0 1 1-6 6H6a8 8 0 1 0 8-8z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
