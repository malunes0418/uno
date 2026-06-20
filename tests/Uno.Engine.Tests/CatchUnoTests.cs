using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class CatchUnoTests
{
    private static GameState Make(bool forced, bool targetCalled) => new()
    {
        Rules = RuleSet.Classic with { ForcedUnoPenalty = forced, UnoPenaltyCards = 2 },
        Players = ImmutableList.Create(
            new Player("p1","P1", ImmutableList.Create(new Card(Color.Green, CardType.Two)),
                false, true, false, 0),
            new Player("p2","P2", ImmutableList.Create(new Card(Color.Red, CardType.Nine)),
                targetCalled, true, false, 0)),
        DrawPile = ImmutableStack.CreateRange(Enumerable.Range(0, 5)
            .Select(_ => new Card(Color.Blue, CardType.Four))),
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void CatchUno_TargetForgotToCall_AppliesPenalty()
    {
        var state = Make(forced: true, targetCalled: false);
        var result = Engine.Apply(state, new CatchUno("p1", "p2"));
        result.State.PlayerById("p2")!.Hand.Count.Should().Be(3);
        result.Events.Should().Contain(e => e is PenaltyApplied);
    }

    [Fact]
    public void CatchUno_TargetCalledUno_IsRejected()
    {
        var state = Make(forced: true, targetCalled: true);
        var result = Engine.Apply(state, new CatchUno("p1", "p2"));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
    }

    [Fact]
    public void CatchUno_RuleOff_IsRejected()
    {
        var state = Make(forced: false, targetCalled: false);
        var result = Engine.Apply(state, new CatchUno("p1", "p2"));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
    }
}
