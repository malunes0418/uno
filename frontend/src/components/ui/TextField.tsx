import type { InputHTMLAttributes } from "react";
import styles from "./TextField.module.css";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function TextField({ label, id, className, ...props }: TextFieldProps) {
  const inputId =
    id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  const inputClassName = [styles.input, className].filter(Boolean).join(" ");

  if (label) {
    return (
      <label className={styles.field} htmlFor={inputId}>
        <span className={styles.label}>{label}</span>
        <input id={inputId} className={inputClassName} {...props} />
      </label>
    );
  }

  return <input id={inputId} className={inputClassName} {...props} />;
}
