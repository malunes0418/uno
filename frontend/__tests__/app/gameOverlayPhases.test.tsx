import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GamePage from "@/app/game/[code]/page";
import { useGameStore } from "@/lib/store/gameStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import type { ClientGameStateDto } from "@/lib/hub/contract";

vi.mock("next/navigation", () => ({
  useParams: () => ({ code: "ABCD" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/three/TableScene", () => ({
  TableScene: () => null,
}));

vi.mock("@/lib/animation/useAnimationQueue", () => ({
  useAnimationQueue: () => {},
}));

const sendCommand = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/hub/gameHubClient", () => ({
  GameHubClient: class {
    registerHandlers = vi.fn();
    start = vi.fn().mockResolvedValue(undefined);
    reconnect = vi.fn().mockResolvedValue(undefined);
    stop = vi.fn();
    sendCommand = sendCommand;
  },
}));

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
        hand: [{ color: "Red", type: "Zero" }, { color: "Blue", type: "Three" }],
        handCount: 2,
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

describe("Game overlay phases", () => {
  beforeEach(() => {
    sendCommand.mockClear();
    useGameStore.getState().reset();
    usePlayerStore.setState({ playerId: "p1", displayName: "Alice" });
  });

  afterEach(() => cleanup());

  it("showsChallengePromptInAwaitingChallengeWhenRuleOn", () => {
    useGameStore.getState().applyState(
      baseState({
        phase: "AwaitingChallenge",
        pendingDraw: 4,
        rules: {
          ...baseState().rules,
          wildDrawFourChallenge: true,
        },
      }),
    );

    render(<GamePage />);

    expect(
      screen.getByRole("dialog", { name: "Wild Draw Four challenge" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Challenge" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
  });

  it("hidesChallengePromptWhenRuleOff", () => {
    useGameStore.getState().applyState(
      baseState({
        phase: "AwaitingChallenge",
        pendingDraw: 4,
        rules: {
          ...baseState().rules,
          wildDrawFourChallenge: false,
        },
      }),
    );

    render(<GamePage />);

    expect(
      screen.queryByRole("dialog", { name: "Wild Draw Four challenge" }),
    ).not.toBeInTheDocument();
  });

  it("showsSevenSwapPromptInAwaitingSevenTarget", () => {
    useGameStore.getState().applyState(
      baseState({
        phase: "AwaitingSevenTarget",
        pendingWildPlayerId: "p1",
        rules: {
          ...baseState().rules,
          sevenZero: true,
        },
      }),
    );

    render(<GamePage />);

    expect(
      screen.getByRole("dialog", { name: "Choose player to swap hands" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bob" })).toBeInTheDocument();
  });

  it("hidesSevenSwapPromptWhenRuleOff", () => {
    useGameStore.getState().applyState(
      baseState({
        phase: "AwaitingSevenTarget",
        pendingWildPlayerId: "p1",
        rules: {
          ...baseState().rules,
          sevenZero: false,
        },
      }),
    );

    render(<GamePage />);

    expect(
      screen.queryByRole("dialog", { name: "Choose player to swap hands" }),
    ).not.toBeInTheDocument();
  });

  it("showsZeroRotateConfirmWhenPendingZeroSelected", () => {
    useGameStore.getState().applyState(
      baseState({
        rules: {
          ...baseState().rules,
          sevenZero: true,
        },
      }),
    );
    useGameStore.getState().setPendingZeroHandIndex(0);

    render(<GamePage />);

    expect(
      screen.getByRole("dialog", { name: "Confirm hand rotation" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/all hands rotate clockwise/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("sendsChallengeCommandWhenChallengeClicked", () => {
    useGameStore.getState().applyState(
      baseState({
        phase: "AwaitingChallenge",
        pendingDraw: 4,
        rules: {
          ...baseState().rules,
          wildDrawFourChallenge: true,
        },
      }),
    );

    render(<GamePage />);
    fireEvent.click(screen.getByRole("button", { name: "Challenge" }));

    expect(sendCommand).toHaveBeenCalledWith(
      "ABCD",
      { type: "Challenge", playerId: "p1" },
      1,
    );
  });
});
