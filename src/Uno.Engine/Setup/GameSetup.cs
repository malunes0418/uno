using System.Collections.Immutable;
using Uno.Engine.Cards;
using Uno.Engine.Internal;
using Uno.Engine.Rng;
using Uno.Engine.State;

namespace Uno.Engine.Setup;

public static class GameSetup
{
    public static GameState NewGame(
        IReadOnlyList<(string Id, string Name, bool IsBot)> seats,
        RuleSet rules,
        int seed)
    {
        var rng = new DeterministicRng(seed);
        var shuffled = rng.Shuffle(DeckFactory.CreateStandardDeck());

        var deck = new List<Card>(shuffled);
        var cursor = 0;

        Card Take() => deck[cursor++];

        var players = seats.Select(s =>
        {
            var hand = ImmutableList.CreateBuilder<Card>();
            for (var i = 0; i < 7; i++) hand.Add(Take());
            return new Player(s.Id, s.Name, hand.ToImmutable(), false, true, s.IsBot, 0);
        }).ToImmutableList();

        Card first;
        do { first = Take(); } while (first.Type == CardType.WildDrawFour);

        var discard = ImmutableList.Create(first);
        var remaining = ImmutableStack.CreateRange(
            Enumerable.Reverse(deck.Skip(cursor).ToList()));

        var direction = 1;
        var currentIndex = 0;
        var pendingDraw = 0;
        var activeColor = first.IsWild ? Color.Wild : first.Color;
        var phase = Phase.AwaitingPlay;

        switch (first.Type)
        {
            case CardType.Reverse:
                direction = -1;
                break;
            case CardType.Skip:
                currentIndex = TurnMath.NextIndex(currentIndex, direction, players.Count);
                break;
            case CardType.DrawTwo:
                pendingDraw = 2;
                break;
            case CardType.Wild:
                phase = Phase.AwaitingColorChoice;
                break;
        }

        return new GameState
        {
            Rules = rules,
            Players = players,
            DrawPile = remaining,
            DiscardPile = discard,
            ActiveColor = activeColor,
            CurrentPlayerIndex = currentIndex,
            Direction = direction,
            PendingDraw = pendingDraw,
            Phase = phase,
            Version = 0,
            RngSeed = seed,
            RngState = rng.State
        };
    }
}
