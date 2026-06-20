import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Home from "@/app/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("Home", () => {
  it("requiresDisplayNameBeforeCreate", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /create room/i }));
    expect(screen.getByText(/enter your name/i)).toBeInTheDocument();
  });
});
