import type { InputHTMLAttributes } from "react";
import styles from "./Checkbox.module.css";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={[styles.checkbox, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
