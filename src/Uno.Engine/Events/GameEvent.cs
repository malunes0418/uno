using Uno.Engine.Cards;

namespace Uno.Engine.Events;

public abstract record GameEvent;

public record CardPlayed(string PlayerId, IReadOnlyList<Card> Cards) : GameEvent;
public record CardsDrawn(string PlayerId, int Count) : GameEvent;
public record TurnPassed(int NextPlayerIndex) : GameEvent;
public record DirectionReversed(int Direction) : GameEvent;
public record ColorChosen(Color Color) : GameEvent;
public record UnoCalled(string PlayerId) : GameEvent;
public record PenaltyApplied(string PlayerId, int Cards, string Reason) : GameEvent;
public record HandsSwapped(string A, string B) : GameEvent;
public record HandsRotated(int Direction) : GameEvent;
public record RoundEnded(string WinnerId, IReadOnlyDictionary<string, int> Scores) : GameEvent;
public record GameEnded(string WinnerId) : GameEvent;
public record CommandRejected(string PlayerId, string Reason) : GameEvent;
