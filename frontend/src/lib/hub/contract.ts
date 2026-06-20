export type StackingMode = "None" | "SameType" | "TwoAndFourInterchangeable";

export interface RuleSetDto {
  stacking: StackingMode;
  drawToMatch: boolean;
  jumpIn: boolean;
  sevenZero: boolean;
  forcedUnoPenalty: boolean;
  sameNumberMultiPlay: boolean;
  cumulativeScoring: boolean;
  wildDrawFourChallenge: boolean;
  targetScore?: number;
  unoPenaltyCards?: number;
}

export interface RoomPlayerDto {
  id: string;
  name: string;
  isBot: boolean;
  connected: boolean;
  isHost: boolean;
}

export interface RoomDto {
  code: string;
  rules: RuleSetDto;
  players: RoomPlayerDto[];
  hostId: string;
  status: "Lobby" | "InGame" | "Finished";
}

export interface CreateRoomResult { code: string; playerId: string; }
export interface JoinRoomResult { playerId: string; }

export interface CardDto { color: string; type: string; }

export interface ClientPlayerDto {
  id: string;
  name: string;
  hand: CardDto[] | null;
  handCount: number;
  hasCalledUno: boolean;
  connected: boolean;
  isBot: boolean;
  score: number;
}

export interface ClientGameStateDto {
  roomCode: string;
  viewerId: string;
  rules: RuleSetDto;
  players: ClientPlayerDto[];
  topCard: CardDto;
  discardPile: CardDto[];
  activeColor: string;
  currentPlayerIndex: number;
  direction: number;
  pendingDraw: number;
  phase: string;
  version: number;
  drawPileCount: number;
  pendingWildPlayerId: string | null;
  challengeActive: boolean;
}

export interface GameEventBatchDto {
  version: number;
  events: GameEventDto[];
}

export type CommandDto =
  | { type: "PlayCard"; playerId: string; handIndexes: number[] }
  | { type: "DrawCard"; playerId: string }
  | { type: "ChooseColor"; playerId: string; color: string }
  | { type: "CallUno"; playerId: string }
  | { type: "CatchUno"; playerId: string; targetId: string }
  | { type: "ChooseSevenSwapTarget"; playerId: string; targetId: string }
  | { type: "Challenge"; playerId: string };

export type PlayCardDto = Extract<CommandDto, { type: "PlayCard" }>;

export type GameEventDto =
  | { type: "CardPlayed"; playerId: string; cards: CardDto[] }
  | { type: "CardsDrawn"; playerId: string; count: number }
  | { type: "TurnPassed"; nextPlayerIndex: number }
  | { type: "DirectionReversed"; direction: number }
  | { type: "ColorChosen"; color: string }
  | { type: "UnoCalled"; playerId: string }
  | { type: "PenaltyApplied"; playerId: string; cards: number; reason: string }
  | { type: "HandsSwapped"; a: string; b: string }
  | { type: "HandsRotated"; direction: number }
  | { type: "RoundEnded"; winnerId: string; scores: Record<string, number> }
  | { type: "GameEnded"; winnerId: string }
  | { type: "CommandRejected"; playerId: string; reason: string };
