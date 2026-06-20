import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore } from "@/lib/store/playerStore";

describe("playerStore", () => {
  beforeEach(() => {
    localStorage.clear();
    usePlayerStore.setState({ playerId: "", displayName: "" });
  });

  it("ensurePlayerId_generatesUuidOnce", () => {
    const id1 = usePlayerStore.getState().ensurePlayerId();
    const id2 = usePlayerStore.getState().ensurePlayerId();
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
