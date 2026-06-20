using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class JumpInTests
{
    private static GameState Make(bool jumpIn) => new()
    {
        Rules = RuleSet.Classic with { JumpIn = jumpIn },
        Players = ImmutableList.Create(
            new Player("p1","P1", ImmutableList.Create(new Card(Color.Green, CardType.Two)),
                false, true, false, 0),
            new Player("p2","P2", ImmutableList.Create(
                new Card(Color.Red, CardType.Five),
                new Card(Color.Blue, CardType.One)),
                false, true, false, 0)),
        DrawPile = ImmutableStack.CreateRange(Enumerable.Range(0, 10)
            .Select(_ => new Card(Color.Blue, CardType.Four))),
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void JumpIn_IdenticalCard_WhenEnabled_PlaysOutOfTurn()
    {
        var state = Make(jumpIn: true);
        var result = Engine.Apply(state, new PlayCard("p2", new[] { 0 }));
        result.State.TopCard.Should().Be(new Card(Color.Red, CardType.Five));
        result.State.PlayerById("p2")!.Hand.Count.Should().Be(1);
        result.State.CurrentPlayer.Id.Should().Be("p1");
    }

    [Fact]
    public void JumpIn_WhenDisabled_IsRejected()
    {
        var state = Make(jumpIn: false);
        var result = Engine.Apply(state, new PlayCard("p2", new[] { 0 }));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
    }

    [Fact]
    public void JumpIn_NonIdenticalCard_IsRejected()
    {
        var state = Make(jumpIn: true);
        var result = Engine.Apply(state, new PlayCard("p2", new[] { 1 }));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
    }
}
