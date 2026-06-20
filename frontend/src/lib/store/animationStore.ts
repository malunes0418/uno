import { create } from "zustand";
import type { ClientGameStateDto } from "@/lib/hub/contract";
import type { TweenDescriptor } from "@/lib/animation/animationQueue";

interface AnimationStore {
  activeTween: TweenDescriptor | null;
  isAnimating: boolean;
  pendingState: ClientGameStateDto | null;
  setActiveTween: (tween: TweenDescriptor | null) => void;
  setAnimating: (value: boolean) => void;
  setPendingState: (state: ClientGameStateDto | null) => void;
  reset: () => void;
}

export const useAnimationStore = create<AnimationStore>((set) => ({
  activeTween: null,
  isAnimating: false,
  pendingState: null,
  setActiveTween: (activeTween) => set({ activeTween }),
  setAnimating: (isAnimating) => set({ isAnimating }),
  setPendingState: (pendingState) => set({ pendingState }),
  reset: () =>
    set({ activeTween: null, isAnimating: false, pendingState: null }),
}));
