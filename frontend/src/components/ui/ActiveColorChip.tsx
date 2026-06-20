import { CardFace } from "@/components/ui/CardFace";
import styles from "./HudOverlay.module.css";

const COLOR_VARS: Record<string, string> = {
  Red: "var(--uno-red)",
  Yellow: "var(--uno-yellow)",
  Green: "var(--uno-green)",
  Blue: "var(--uno-blue)",
  Wild: "var(--uno-black)",
};

type ActiveColorChipProps = {
  color: string;
  topCardType?: string;
};

export function ActiveColorChip({ color, topCardType }: ActiveColorChipProps) {
  const swatchColor = COLOR_VARS[color] ?? COLOR_VARS.Wild;
  const showWildCard = color === "Wild";

  return (
    <div className={styles.colorChip} aria-label={`Active color: ${color}`} title={`Active color: ${color}`}>
      {showWildCard ? (
        <CardFace
          color="Wild"
          type={topCardType === "WildDrawFour" ? "WildDrawFour" : "Wild"}
          size="sm"
          className={styles.colorCard}
        />
      ) : (
        <span className={styles.colorDot} style={{ backgroundColor: swatchColor }} />
      )}
      <span className={styles.colorLabel}>{color}</span>
    </div>
  );
}
