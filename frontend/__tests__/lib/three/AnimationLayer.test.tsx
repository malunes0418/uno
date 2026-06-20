import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AnimationLayer } from "@/lib/three/AnimationLayer";
import { CardTextureProvider } from "@/lib/three/CardTextureProvider";
import { useAnimationStore } from "@/lib/store/animationStore";

const { mockUseFrame } = vi.hoisted(() => ({
  mockUseFrame: vi.fn(),
}));

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
    useFrame: mockUseFrame,
    Canvas: ({ children }: { children: ReactNode }) => (
      <div data-testid="mock-canvas">{children}</div>
    ),
    useLoader: () => mockTexture,
  };
});

describe("AnimationLayer", () => {
  beforeEach(() => {
    mockUseFrame.mockClear();
    useAnimationStore.getState().reset();
  });

  it("doesNotRegisterFrameLoopWhenIdle", () => {
    render(
      <CardTextureProvider>
        <AnimationLayer />
      </CardTextureProvider>,
    );
    expect(mockUseFrame).not.toHaveBeenCalled();
  });

  it("mountsPlayArcTweenWhenActive", () => {
    useAnimationStore.setState({
      activeTween: {
        kind: "playArc",
        playerId: "p1",
        cards: [{ color: "Red", type: "Five" }],
        durationMs: 450,
      },
      isAnimating: true,
    });

    render(
      <CardTextureProvider>
        <AnimationLayer />
      </CardTextureProvider>,
    );

    expect(mockUseFrame).toHaveBeenCalled();
    expect(useAnimationStore.getState().activeTween?.kind).toBe("playArc");
  });

  it("mountsDrawTweenWhenActive", () => {
    useAnimationStore.setState({
      activeTween: {
        kind: "draw",
        playerId: "p2",
        count: 2,
        durationMs: 300,
      },
      isAnimating: true,
    });

    render(
      <CardTextureProvider>
        <AnimationLayer />
      </CardTextureProvider>,
    );

    expect(mockUseFrame).toHaveBeenCalled();
    expect(useAnimationStore.getState().activeTween?.kind).toBe("draw");
  });
});
