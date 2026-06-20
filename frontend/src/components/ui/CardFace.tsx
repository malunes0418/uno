import styles from "./CardFace.module.css";

type CardFaceProps = {
  face?: "back" | "front";
  className?: string;
};

export function CardFace({ face = "back", className }: CardFaceProps) {
  const classes = [styles.card, styles[face], className].filter(Boolean).join(" ");

  return <div className={classes} data-face={face} aria-hidden />;
}
