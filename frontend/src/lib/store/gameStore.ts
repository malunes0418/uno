import { create } from "zustand";
import type { RoomDto, ClientGameStateDto, GameEventBatchDto, GameEventDto } from "@/lib/hub/contract";
import { useAnimationStore } from "./animationStore";

interface GameStore {
  room: RoomDto | null;
  gameState: ClientGameStateDto | null;
  eventQueue: GameEventDto[];
  error: string | null;
  pendingZeroHandIndex: number | null;
  setRoom: (room: RoomDto) => void;
  applyState: (state: ClientGameStateDto) => void;
  commitPendingState: () => void;
  enqueueEvents: (batch: GameEventBatchDto) => void;
  dequeueEvent: () => GameEventDto | undefined;
  setError: (msg: string | null) => void;
  setPendingZeroHandIndex: (index: number | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  room: null,
  gameState: null,
  eventQueue: [],
  error: null,
  pendingZeroHandIndex: null,
  setRoom: (room) => set({ room }),
  applyState: (state) => {
    if (useAnimationStore.getState().isAnimating) {
      useAnimationStore.getState().setPendingState(state);
      return;
    }
    set({ gameState: state, pendingZeroHandIndex: null });
  },
  commitPendingState: () => {
    const pending = useAnimationStore.getState().pendingState;
    if (!pending) return;
    useAnimationStore.getState().setPendingState(null);
    set({ gameState: pending, pendingZeroHandIndex: null });
  },
  enqueueEvents: (batch) => set((s) => ({
    eventQueue: [...s.eventQueue, ...batch.events],
  })),
  dequeueEvent: () => {
    const [head, ...rest] = get().eventQueue;
    set({ eventQueue: rest });
    return head;
  },
  setError: (error) => set({ error }),
  setPendingZeroHandIndex: (index) => set({ pendingZeroHandIndex: index }),
  reset: () =>
    set({ room: null, gameState: null, eventQueue: [], error: null, pendingZeroHandIndex: null }),
}));
