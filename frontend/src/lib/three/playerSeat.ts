import type { ClientPlayerDto } from "@/lib/hub/contract";

const VIEWER_HAND: [number, number, number] = [0, 0.05, 3.2];
const DISCARD_PILE: [number, number, number] = [0.8, 0.05, 0];
const DRAW_PILE: [number, number, number] = [-0.8, 0.05, 0];

export function seatPosition(
  viewerIndex: number,
  playerIndex: number,
  total: number,
): [number, number, number] {
  const rel = (playerIndex - viewerIndex + total) % total;
  const angle = Math.PI / 2 - rel * ((2 * Math.PI) / total);
  const rx = 4;
  const rz = 2.8;
  return [rx * Math.cos(angle), 0.05, rz * Math.sin(angle)];
}

export function playerSeat(
  playerId: string,
  viewerId: string,
  players: ClientPlayerDto[],
): [number, number, number] {
  if (playerId === viewerId) return VIEWER_HAND;
  const viewerIndex = players.findIndex((p) => p.id === viewerId);
  const playerIndex = players.findIndex((p) => p.id === playerId);
  if (viewerIndex < 0 || playerIndex < 0) return VIEWER_HAND;
  return seatPosition(viewerIndex, playerIndex, players.length);
}

export const PILE_POSITIONS = {
  discard: DISCARD_PILE,
  draw: DRAW_PILE,
} as const;
