import type { CardDto, ClientGameStateDto } from "@/lib/hub/contract";

export function isPlayable(card: CardDto, top: CardDto, activeColor: string): boolean {
  if (card.color === "Wild") return true;
  return card.color === activeColor || card.type === top.type;
}

export function playableIndexes(state: ClientGameStateDto, playerId: string): Set<number> {
  const me = state.players.find((p) => p.id === playerId);
  if (!me?.hand) return new Set();
  const isMyTurn = state.players[state.currentPlayerIndex]?.id === playerId;
  const jumpOk = state.rules.jumpIn && state.phase === "AwaitingPlay" && state.pendingDraw === 0;
  if (!isMyTurn && !jumpOk) return new Set();
  const indexes = new Set<number>();
  me.hand.forEach((c, i) => {
    if (isPlayable(c, state.topCard, state.activeColor)) indexes.add(i);
  });
  return indexes;
}
