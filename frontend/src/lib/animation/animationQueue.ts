import type { GameEventDto } from "@/lib/hub/contract";

export type TweenDescriptor =
  | { kind: "playArc"; playerId: string; cards: { color: string; type: string }[]; durationMs: number }
  | { kind: "draw"; playerId: string; count: number; durationMs: number }
  | { kind: "passTurn"; nextIndex: number; durationMs: number }
  | { kind: "reverse"; direction: number; durationMs: number }
  | { kind: "colorBurst"; color: string; durationMs: number }
  | { kind: "unoShout"; playerId: string; durationMs: number }
  | { kind: "penalty"; playerId: string; cards: number; durationMs: number }
  | { kind: "swapHands"; a: string; b: string; durationMs: number }
  | { kind: "rotateHands"; direction: number; durationMs: number }
  | { kind: "roundEnd"; winnerId: string; durationMs: number }
  | { kind: "noop"; durationMs: number };

export function eventToTween(ev: GameEventDto): TweenDescriptor {
  switch (ev.type) {
    case "CardPlayed": return { kind: "playArc", playerId: ev.playerId, cards: ev.cards, durationMs: 450 };
    case "CardsDrawn": return { kind: "draw", playerId: ev.playerId, count: ev.count, durationMs: 300 };
    case "TurnPassed": return { kind: "passTurn", nextIndex: ev.nextPlayerIndex, durationMs: 200 };
    case "DirectionReversed": return { kind: "reverse", direction: ev.direction, durationMs: 500 };
    case "ColorChosen": return { kind: "colorBurst", color: ev.color, durationMs: 400 };
    case "UnoCalled": return { kind: "unoShout", playerId: ev.playerId, durationMs: 600 };
    case "PenaltyApplied": return { kind: "penalty", playerId: ev.playerId, cards: ev.cards, durationMs: 400 };
    case "HandsSwapped": return { kind: "swapHands", a: ev.a, b: ev.b, durationMs: 700 };
    case "HandsRotated": return { kind: "rotateHands", direction: ev.direction, durationMs: 800 };
    case "RoundEnded": return { kind: "roundEnd", winnerId: ev.winnerId, durationMs: 1200 };
    case "CommandRejected": return { kind: "noop", durationMs: 0 };
    default: return { kind: "noop", durationMs: 0 };
  }
}
