import type { CSSProperties } from "react";
import {
  CARD_ATLAS_URL,
  atlasBackgroundStyle,
  atlasBackgroundStyleFromUv,
  uvForBack,
} from "@/lib/cards/cardAtlas";
import styles from "./CardFace.module.css";

export type CardFaceSize = "sm" | "md" | "lg";

type CardFaceProps = {
  color?: string;
  type?: string;
  faceUp?: boolean;
  size?: CardFaceSize;
  className?: string;
  style?: CSSProperties;
};

export function CardFace({
  color = "Red",
  type = "Five",
  faceUp = true,
  size = "md",
  className,
  style,
}: CardFaceProps) {
  const atlasStyle = faceUp
    ? atlasBackgroundStyle(color, type)
    : atlasBackgroundStyleFromUv(uvForBack());

  const classes = [styles.card, styles[size], className].filter(Boolean).join(" ");

  return (
    <div
      className={classes}
      style={{
        backgroundImage: `url(${CARD_ATLAS_URL})`,
        ...atlasStyle,
        ...style,
      }}
      data-face={faceUp ? "front" : "back"}
      aria-hidden
    />
  );
}
