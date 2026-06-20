import { create } from "zustand";
import type { RoomDto, ClientGameStateDto, GameEventBatchDto, GameEventDto } from "@/lib/hub/contract";

interface GameStore {
  room: RoomDto | null;
  gameState: ClientGameStateDto | null;
  eventQueue: GameEventDto[];
  error: string | null;
  setRoom: (room: RoomDto) => void;
  applyState: (state: ClientGameStateDto) => void;
  enqueueEvents: (batch: GameEventBatchDto) => void;
  dequeueEvent: () => GameEventDto | undefined;
  setError: (msg: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  room: null,
  gameState: null,
  eventQueue: [],
  error: null,
  setRoom: (room) => set({ room }),
  applyState: (state) => set({ gameState: state }),
  enqueueEvents: (batch) => set((s) => ({
    eventQueue: [...s.eventQueue, ...batch.events],
  })),
  dequeueEvent: () => {
    const [head, ...rest] = get().eventQueue;
    set({ eventQueue: rest });
    return head;
  },
  setError: (error) => set({ error }),
  reset: () => set({ room: null, gameState: null, eventQueue: [], error: null }),
}));
