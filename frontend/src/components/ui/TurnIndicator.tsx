import styles from "./HudOverlay.module.css";

type TurnIndicatorProps = {
  name: string;
  isYou?: boolean;
};

export function TurnIndicator({ name, isYou = false }: TurnIndicatorProps) {
  return (
    <div
      className={[styles.turnPill, isYou ? styles.turnPillYou : ""].filter(Boolean).join(" ")}
      aria-label={isYou ? `Your turn: ${name}` : `Current turn: ${name}`}
    >
      {isYou && <span className={styles.youBadge}>You</span>}
      <span className={styles.turnName}>{name}</span>
    </div>
  );
}
