import { describe, it, expect, vi } from "vitest";
import { GameHubClient } from "@/lib/hub/gameHubClient";

describe("gameHubClient", () => {
  it("createRoom_invokesHubMethod", async () => {
    const invoke = vi.fn().mockResolvedValue({ code: "ABC123", playerId: "p1" });
    const client = new GameHubClient({ invoke, on: vi.fn(), start: vi.fn() } as never);
    const result = await client.createRoom(
      { stacking: "None", drawToMatch: false, jumpIn: false, sevenZero: false,
        forcedUnoPenalty: false, sameNumberMultiPlay: false, cumulativeScoring: false,
        wildDrawFourChallenge: false },
      "Alice", "p1");
    expect(invoke).toHaveBeenCalledWith("CreateRoom", expect.anything(), "Alice", "p1");
    expect(result.code).toBe("ABC123");
  });
});
