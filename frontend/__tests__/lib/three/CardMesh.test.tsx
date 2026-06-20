import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { CardMesh } from "@/lib/three/CardMesh";
import { CardTextureProvider } from "@/lib/three/CardTextureProvider";

const mockTexture = {
  clone: vi.fn(function clone(this: typeof mockTexture) {
    return {
      wrapS: 0,
      wrapT: 0,
      offset: { set: vi.fn() },
      repeat: { set: vi.fn() },
      needsUpdate: false,
      dispose: vi.fn(),
    };
  }),
  dispose: vi.fn(),
};

vi.mock("@react-three/fiber", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@react-three/fiber")>();
  return {
    ...actual,
    Canvas: ({ children }: { children: ReactNode }) => (
      <div data-testid="mock-canvas">{children}</div>
    ),
    useLoader: () => mockTexture,
  };
});

describe("CardMesh", () => {
  it("rendersWithoutThrowingWhenWrappedInProvider", () => {
    expect(() =>
      render(
        <div data-testid="mock-canvas">
          <CardTextureProvider>
            <CardMesh color="Red" type="Five" />
          </CardTextureProvider>
        </div>,
      ),
    ).not.toThrow();
  });
});
