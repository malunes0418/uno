using System.Collections.Immutable;
using Uno.Engine.Cards;

namespace Uno.Engine.State;

public record GameState
{
    public required RuleSet Rules { get; init; }
    public required ImmutableList<Player> Players { get; init; }
    public required ImmutableStack<Card> DrawPile { get; init; }
    public required ImmutableList<Card> DiscardPile { get; init; }
    public required Color ActiveColor { get; init; }
    public required int CurrentPlayerIndex { get; init; }
    public required int Direction { get; init; }
    public required int PendingDraw { get; init; }
    public required Phase Phase { get; init; }
    public required int Version { get; init; }
    public required int RngSeed { get; init; }
    public required int RngState { get; init; }
    public string? PendingWildPlayerId { get; init; }
    public ChallengeContext? Challenge { get; init; }

    public Card TopCard => DiscardPile[^1];
    public Player CurrentPlayer => Players[CurrentPlayerIndex];
    public Player? PlayerById(string id) => Players.FirstOrDefault(p => p.Id == id);
}
