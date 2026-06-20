import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LobbyPage from "@/app/lobby/[code]/page";
import { useGameStore } from "@/lib/store/gameStore";
import { usePlayerStore } from "@/lib/store/playerStore";
import type { RuleSetDto } from "@/lib/hub/contract";

vi.mock("next/navigation", () => ({
  useParams: () => ({ code: "ABCD" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/hub/gameHubClient", () => ({
  GameHubClient: class {
    registerHandlers = vi.fn();
    start = vi.fn().mockResolvedValue(undefined);
    reconnect = vi.fn().mockResolvedValue(undefined);
    stop = vi.fn();
    addBot = vi.fn();
    startGame = vi.fn();
  },
}));

const defaultRules: RuleSetDto = {
  stacking: "SameType",
  drawToMatch: false,
  jumpIn: true,
  sevenZero: false,
  forcedUnoPenalty: false,
  sameNumberMultiPlay: false,
  cumulativeScoring: false,
  wildDrawFourChallenge: false,
};

describe("LobbyPage", () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    usePlayerStore.setState({ playerId: "host-1", displayName: "Alice" });
  });

  afterEach(() => {
    cleanup();
  });

  it("rendersRoomCodePlayersAndHostControls", () => {
    useGameStore.getState().setRoom({
      code: "ABCD",
      hostId: "host-1",
      status: "Lobby",
      rules: defaultRules,
      players: [
        {
          id: "host-1",
          name: "Alice",
          isBot: false,
          connected: true,
          isHost: true,
        },
        {
          id: "bot-1",
          name: "Bot 1",
          isBot: true,
          connected: true,
          isHost: false,
        },
      ],
    });

    render(<LobbyPage />);

    expect(screen.getByLabelText(/room code/i)).toHaveTextContent("ABCD");
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bot 1")).toBeInTheDocument();
    expect(screen.getByText("Bot")).toBeInTheDocument();
    expect(screen.getByLabelText("Host")).toBeInTheDocument();
    expect(screen.getByText("Same-type stacking")).toBeInTheDocument();
    expect(screen.getByText("Jump-in")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add bot/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start game/i })).toBeInTheDocument();
  });

  it("showsLoadingStateWhileRoomIsNull", () => {
    render(<LobbyPage />);

    expect(screen.getByLabelText(/connecting to room/i)).toBeInTheDocument();
    expect(screen.getByText(/joining the table/i)).toBeInTheDocument();
  });

  it("showsErrorBannerFromGameStore", () => {
    useGameStore.getState().setError("Room not found");

    render(<LobbyPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Room not found");
  });

  it("showsWaitingHintForNonHost", () => {
    useGameStore.getState().setRoom({
      code: "ABCD",
      hostId: "other-host",
      status: "Lobby",
      rules: defaultRules,
      players: [
        {
          id: "guest-1",
          name: "Bob",
          isBot: false,
          connected: true,
          isHost: false,
        },
      ],
    });
    usePlayerStore.setState({ playerId: "guest-1", displayName: "Bob" });

    render(<LobbyPage />);

    expect(screen.getByText(/waiting for the host/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start game/i })).not.toBeInTheDocument();
  });
});
