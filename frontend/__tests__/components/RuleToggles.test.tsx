import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RuleToggles } from "@/components/ui/RuleToggles";

describe("RuleToggles", () => {
  it("togglesJumpIn", () => {
    const onChange = vi.fn();
    render(
      <RuleToggles
        rules={{
          stacking: "None",
          drawToMatch: false,
          jumpIn: false,
          sevenZero: false,
          forcedUnoPenalty: false,
          sameNumberMultiPlay: false,
          cumulativeScoring: false,
          wildDrawFourChallenge: false,
        }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText(/jump-in/i));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ jumpIn: true }),
    );
  });
});
