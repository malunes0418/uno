import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ActiveColorChip } from "@/components/ui/ActiveColorChip";
import { DirectionBadge } from "@/components/ui/DirectionBadge";
import { HudOverlay } from "@/components/ui/HudOverlay";
import { TurnIndicator } from "@/components/ui/TurnIndicator";
import { useGameStore } from "@/lib/store/gameStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import type { ClientGameStateDto } from "@/lib/hub/contract";

function baseState(overrides: Partial<ClientGameStateDto> = {}): ClientGameStateDto {
  return {
    roomCode: "ABCD",
    viewerId: "p1",
    rules: {
      stacking: "None",
      drawToMatch: false,
      jumpIn: false,
      sevenZero: false,
      forcedUnoPenalty: false,
      sameNumberMultiPlay: false,
      cumulativeScoring: false,
      wildDrawFourChallenge: false,
    },
    players: [
      {
        id: "p1",
        name: "Alice",
        hand: [],
        handCount: 5,
        hasCalledUno: false,
        connected: true,
        isBot: false,
        score: 0,
      },
      {
        id: "p2",
        name: "Bob",
        hand: null,
        handCount: 4,
        hasCalledUno: false,
        connected: true,
        isBot: false,
        score: 0,
      },
    ],
    topCard: { color: "Red", type: "Five" },
    discardPile: [{ color: "Red", type: "Five" }],
    activeColor: "Red",
    currentPlayerIndex: 0,
    direction: 1,
    pendingDraw: 0,
    phase: "AwaitingPlay",
    version: 1,
    drawPileCount: 80,
    pendingWildPlayerId: null,
    challengeActive: false,
    ...overrides,
  };
}

afterEach(() => cleanup());

describe("TurnIndicator", () => {
  it("highlightsWhenYou", () => {
    render(<TurnIndicator name="Alice" isYou />);
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByLabelText("Your turn: Alice")).toBeInTheDocument();
  });
});

describe("DirectionBadge", () => {
  it("labelsClockwiseAndCounterClockwise", () => {
    const { rerender } = render(<DirectionBadge direction={1} />);
    expect(screen.getByLabelText("Direction: Clockwise")).toBeInTheDocument();

    rerender(<DirectionBadge direction={-1} />);
    expect(screen.getByLabelText("Direction: Counter-clockwise")).toBeInTheDocument();
  });
});

describe("ActiveColorChip", () => {
  it("showsColorDotForStandardColor", () => {
    render(<ActiveColorChip color="Blue" />);
    expect(screen.getByLabelText("Active color: Blue")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
  });
});

describe("HudOverlay", () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    usePlayerStore.setState({ playerId: "p1", displayName: "Alice" });
  });

  it("rendersTopBarWithDrawStackAndPhase", () => {
    useGameStore.getState().applyState(
      baseState({
        pendingDraw: 4,
        topCard: { color: "Wild", type: "WildDrawFour" },
        phase: "AwaitingChallenge",
      }),
    );

    render(<HudOverlay />);
    expect(screen.getByLabelText("Your turn: Alice")).toBeInTheDocument();
    expect(screen.getByLabelText("Draw stack: plus 4")).toBeInTheDocument();
    expect(screen.getByText("Challenge window")).toBeInTheDocument();
  });

  it("showsAutoDismissToastForHubError", () => {
    useGameStore.getState().setError("Room not found");
    render(<HudOverlay />);
    expect(screen.getByRole("alert")).toHaveTextContent("Room not found");
  });
});
