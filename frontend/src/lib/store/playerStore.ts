import { create } from "zustand";

const PLAYER_ID_KEY = "uno.playerId";
const DISPLAY_NAME_KEY = "uno.displayName";

interface PlayerState {
  playerId: string;
  displayName: string;
  ensurePlayerId: () => string;
  setDisplayName: (name: string) => void;
  load: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  playerId: "",
  displayName: "",
  load: () => {
    const playerId = localStorage.getItem(PLAYER_ID_KEY) ?? "";
    const displayName = localStorage.getItem(DISPLAY_NAME_KEY) ?? "";
    set({ playerId, displayName });
  },
  ensurePlayerId: () => {
    let { playerId } = get();
    if (!playerId) {
      playerId = crypto.randomUUID();
      localStorage.setItem(PLAYER_ID_KEY, playerId);
      set({ playerId });
    }
    return playerId;
  },
  setDisplayName: (name: string) => {
    localStorage.setItem(DISPLAY_NAME_KEY, name);
    set({ displayName: name });
  },
}));
