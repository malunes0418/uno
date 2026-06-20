"use client";

import type { RuleSetDto, StackingMode } from "@/lib/hub/contract";
import { Checkbox } from "@/components/ui/Checkbox";
import styles from "./RuleToggles.module.css";

type Props = {
  rules: RuleSetDto;
  onChange: (rules: RuleSetDto) => void;
};

const BOOL_RULES: { key: keyof RuleSetDto; label: string }[] = [
  { key: "drawToMatch", label: "Draw to match" },
  { key: "jumpIn", label: "Jump-in" },
  { key: "sevenZero", label: "Seven-Zero" },
  { key: "forcedUnoPenalty", label: "Forced UNO penalty" },
  { key: "sameNumberMultiPlay", label: "Same number multi-play" },
  { key: "cumulativeScoring", label: "Cumulative scoring" },
  { key: "wildDrawFourChallenge", label: "Wild Draw Four challenge" },
];

export function RuleToggles({ rules, onChange }: Props) {
  const toggle = (key: keyof RuleSetDto) => {
    onChange({ ...rules, [key]: !rules[key] });
  };

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>House rules</legend>
      <div className={styles.grid}>
        <label className={styles.row}>
          <span className={styles.rowLabel}>Stacking</span>
          <select
            className={styles.select}
            value={rules.stacking}
            onChange={(e) =>
              onChange({ ...rules, stacking: e.target.value as StackingMode })
            }
          >
            <option value="None">None</option>
            <option value="SameType">Same type</option>
            <option value="TwoAndFourInterchangeable">
              +2/+4 interchangeable
            </option>
          </select>
        </label>
        {BOOL_RULES.map(({ key, label }) => (
          <label key={key} className={styles.row}>
            <span className={styles.rowLabel}>{label}</span>
            <Checkbox
              checked={rules[key] as boolean}
              onChange={() => toggle(key)}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
