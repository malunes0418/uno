import type { CommandDto } from "./contract";

export const playCard = (playerId: string, handIndexes: number[]): CommandDto =>
  ({ type: "PlayCard", playerId, handIndexes });
export const drawCard = (playerId: string): CommandDto => ({ type: "DrawCard", playerId });
export const chooseColor = (playerId: string, color: string): CommandDto =>
  ({ type: "ChooseColor", playerId, color });
export const callUno = (playerId: string): CommandDto => ({ type: "CallUno", playerId });
export const catchUno = (playerId: string, targetId: string): CommandDto =>
  ({ type: "CatchUno", playerId, targetId });
export const challenge = (playerId: string): CommandDto => ({ type: "Challenge", playerId });
