import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import Home from "@/app/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("Home", () => {
  afterEach(() => {
    cleanup();
  });
  it("rendersHeroAndFormSections", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: /uno classic/i })).toBeInTheDocument();
    expect(screen.getByText(/deal in, stack wilds/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /house rules/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create room/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/join with code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^join$/i })).toBeInTheDocument();
  });

  it("requiresDisplayNameBeforeCreate", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /create room/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/enter your name/i);
  });
});
