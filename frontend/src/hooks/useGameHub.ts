"use client";

import { useRef } from "react";
import type { GameHubClient } from "@/lib/hub/gameHubClient";

/** Placeholder — Task 10 wires connect, handlers, and reconnect. */
export function useGameHub(_code: string) {
  const hubRef = useRef<GameHubClient | null>(null);
  return hubRef;
}
