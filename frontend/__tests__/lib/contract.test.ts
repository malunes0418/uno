import { describe, it, expect } from "vitest";
import type { PlayCardDto, CommandDto } from "@/lib/hub/contract";

describe("contract", () => {
  it("playCardDto_hasDiscriminator", () => {
    const cmd: PlayCardDto = { type: "PlayCard", playerId: "p1", handIndexes: [0] };
    expect(cmd.type).toBe("PlayCard");
  });
});
