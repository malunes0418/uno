using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class ActionCardTests
{
    private static GameState ThreePlayers(Card p1Card, Card top, RuleSet? rules = null,
        int pendingDraw = 0) => new()
    {
        Rules = rules ?? RuleSet.Classic,
        Players = ImmutableList.Create(
            new Player("p1","P1", ImmutableList.Create(p1Card, new Card(Color.Green, CardType.Three)),
                false, true, false, 0),
            new Player("p2","P2", ImmutableList.Create(new Card(Color.Green, CardType.One)),
                false, true, false, 0),
            new Player("p3","P3", ImmutableList.Create(new Card(Color.Green, CardType.Two)),
                false, true, false, 0)),
        DrawPile = ImmutableStack.CreateRange(Enumerable.Range(0, 10)
            .Select(_ => new Card(Color.Blue, CardType.Four))),
        DiscardPile = ImmutableList.Create(top),
        ActiveColor = top.IsWild ? Color.Red : top.Color,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = pendingDraw,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void Skip_AdvancesPastNextPlayer()
    {
        var state = ThreePlayers(new Card(Color.Red, CardType.Skip), new Card(Color.Red, CardType.Five));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.State.CurrentPlayer.Id.Should().Be("p3");
    }

    [Fact]
    public void Reverse_FlipsDirection()
    {
        var state = ThreePlayers(new Card(Color.Red, CardType.Reverse), new Card(Color.Red, CardType.Five));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.State.Direction.Should().Be(-1);
        result.Events.Should().Contain(e => e is DirectionReversed);
        result.State.CurrentPlayer.Id.Should().Be("p3");
    }

    [Fact]
    public void DrawTwo_AddsToPendingDraw()
    {
        var state = ThreePlayers(new Card(Color.Red, CardType.DrawTwo), new Card(Color.Red, CardType.Five));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.State.PendingDraw.Should().Be(2);
        result.State.CurrentPlayer.Id.Should().Be("p2");
    }

    [Fact]
    public void DrawTwo_OnActiveChain_WhenStackingOff_IsRejected()
    {
        var state = ThreePlayers(new Card(Color.Red, CardType.DrawTwo),
            new Card(Color.Blue, CardType.DrawTwo), pendingDraw: 2);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
    }

    [Fact]
    public void DrawTwo_OnActiveChain_WhenStackingOn_Accumulates()
    {
        var rules = RuleSet.Classic with { Stacking = StackingMode.SameType };
        var state = ThreePlayers(new Card(Color.Red, CardType.DrawTwo),
            new Card(Color.Blue, CardType.DrawTwo), rules, pendingDraw: 2);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.State.PendingDraw.Should().Be(4);
    }
}
