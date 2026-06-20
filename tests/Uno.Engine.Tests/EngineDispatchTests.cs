using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class EngineDispatchTests
{
    private static GameState MinimalState() => new()
    {
        Rules = RuleSet.Classic,
        Players = ImmutableList.Create(
            new Player("p1", "P1", ImmutableList<Card>.Empty, false, true, false, 0)),
        DrawPile = ImmutableStack<Card>.Empty,
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.One)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 5, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void Apply_PlayFromNonCurrentPlayer_IsRejectedAndStateUnchanged()
    {
        var state = MinimalState();
        var result = Engine.Apply(state, new DrawCard("ghost"));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
        result.State.Version.Should().Be(5);
    }
}
