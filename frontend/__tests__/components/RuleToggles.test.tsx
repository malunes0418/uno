import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { RuleToggles } from "@/components/ui/RuleToggles";
import styles from "@/components/ui/RuleToggles.module.css";

const defaultRules = {
  stacking: "None" as const,
  drawToMatch: false,
  jumpIn: false,
  sevenZero: false,
  forcedUnoPenalty: false,
  sameNumberMultiPlay: false,
  cumulativeScoring: false,
  wildDrawFourChallenge: false,
};

describe("RuleToggles", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("rendersGridLayout", () => {
    const { container } = render(
      <RuleToggles rules={defaultRules} onChange={vi.fn()} />,
    );

    const grid = container.querySelector(`.${styles.grid}`);
    expect(grid).toBeInTheDocument();
    expect(grid?.children.length).toBe(8);
  });

  it("togglesJumpIn", () => {
    const onChange = vi.fn();
    render(
      <RuleToggles rules={defaultRules} onChange={onChange} />,
    );
    fireEvent.click(screen.getByLabelText(/jump-in/i));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ jumpIn: true }),
    );
  });
});
