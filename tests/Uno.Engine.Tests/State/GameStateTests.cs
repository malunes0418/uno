using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests.State;

public class GameStateTests
{
    [Fact]
    public void TopCard_ReturnsLastDiscard()
    {
        var state = new GameState
        {
            Rules = RuleSet.Classic,
            Players = ImmutableList<Player>.Empty,
            DrawPile = ImmutableStack<Card>.Empty,
            DiscardPile = ImmutableList.Create(
                new Card(Color.Red, CardType.One),
                new Card(Color.Blue, CardType.Five)),
            ActiveColor = Color.Blue,
            CurrentPlayerIndex = 0,
            Direction = 1,
            PendingDraw = 0,
            Phase = Phase.AwaitingPlay,
            Version = 0,
            RngSeed = 1,
            RngState = 1
        };
        state.TopCard.Should().Be(new Card(Color.Blue, CardType.Five));
    }
}
