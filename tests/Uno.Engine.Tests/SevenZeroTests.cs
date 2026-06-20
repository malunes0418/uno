using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class SevenZeroTests
{
    private static Player P(string id, params Card[] cards) =>
        new(id, id, ImmutableList.Create(cards), false, true, false, 0);

    private static GameState Make(Card p1Lead, Card extra, bool sevenZero) => new()
    {
        Rules = RuleSet.Classic with { SevenZero = sevenZero },
        Players = ImmutableList.Create(
            P("p1", p1Lead, extra),
            P("p2", new Card(Color.Green, CardType.One)),
            P("p3", new Card(Color.Yellow, CardType.Two))),
        DrawPile = ImmutableStack.CreateRange(Enumerable.Range(0, 5)
            .Select(_ => new Card(Color.Blue, CardType.Four))),
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void PlaySeven_EntersTargetPhase_ThenSwapsHands()
    {
        var state = Make(new Card(Color.Red, CardType.Seven), new Card(Color.Red, CardType.One), true);
        var afterPlay = Engine.Apply(state, new PlayCard("p1", new[] { 0 })).State;
        afterPlay.Phase.Should().Be(Phase.AwaitingSevenTarget);

        var result = Engine.Apply(afterPlay, new ChooseSevenSwapTarget("p1", "p3"));
        result.State.PlayerById("p1")!.Hand.Should().ContainSingle()
            .Which.Should().Be(new Card(Color.Yellow, CardType.Two));
        result.State.PlayerById("p3")!.Hand.Should().ContainSingle()
            .Which.Should().Be(new Card(Color.Red, CardType.One));
        result.Events.Should().Contain(e => e is HandsSwapped);
    }

    [Fact]
    public void PlayZero_RotatesAllHandsInDirection()
    {
        var state = Make(new Card(Color.Red, CardType.Zero), new Card(Color.Red, CardType.One), true);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.Events.Should().Contain(e => e is HandsRotated);
    }

    [Fact]
    public void PlaySeven_WhenRuleOff_BehavesAsNumberCard()
    {
        var state = Make(new Card(Color.Red, CardType.Seven), new Card(Color.Red, CardType.One), false);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.State.Phase.Should().Be(Phase.AwaitingPlay);
        result.State.CurrentPlayer.Id.Should().Be("p2");
    }
}
