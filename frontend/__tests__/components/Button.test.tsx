import { render, screen } from "@testing-library/react";
import { afterEach, describe, it, expect } from "vitest";
import { Button } from "@/components/ui/Button";
import styles from "@/components/ui/Button.module.css";

describe("Button", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("rendersPrimaryVariant", () => {
    render(<Button variant="primary">Create Room</Button>);
    const button = screen.getByRole("button", { name: /create room/i });
    expect(button.className).toContain(styles.primary);
    expect(button.className).toContain(styles.button);
  });

  it("rendersSecondaryVariant", () => {
    render(<Button variant="secondary">Join</Button>);
    const button = screen.getByRole("button", { name: /join/i });
    expect(button.className).toContain(styles.secondary);
  });

  it("rendersGhostVariant", () => {
    render(<Button variant="ghost">Cancel</Button>);
    const button = screen.getByRole("button", { name: /cancel/i });
    expect(button.className).toContain(styles.ghost);
  });

  it("rendersDisabledState", () => {
    render(
      <Button variant="primary" disabled>
        Disabled Action
      </Button>,
    );
    expect(
      screen.getByRole("button", { name: /disabled action/i }),
    ).toBeDisabled();
  });
});
