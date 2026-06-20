"use client";

import { createContext, useContext, type RefObject, type ReactNode } from "react";
import type { GameHubClient } from "./gameHubClient";

const GameHubContext = createContext<RefObject<GameHubClient | null> | null>(null);

export function GameHubProvider({
  hubRef,
  children,
}: {
  hubRef: RefObject<GameHubClient | null>;
  children: ReactNode;
}) {
  return <GameHubContext.Provider value={hubRef}>{children}</GameHubContext.Provider>;
}

export function useGameHubRef() {
  const ref = useContext(GameHubContext);
  if (!ref) throw new Error("useGameHubRef must be used within GameHubProvider");
  return ref;
}
