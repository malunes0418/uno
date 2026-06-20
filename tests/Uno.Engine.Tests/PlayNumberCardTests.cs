using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class PlayNumberCardTests
{
    private static GameState Make(ImmutableList<Card> p1Hand, RuleSet? rules = null) => new()
    {
        Rules = rules ?? RuleSet.Classic,
        Players = ImmutableList.Create(
            new Player("p1","P1", p1Hand, false, true, false, 0),
            new Player("p2","P2", ImmutableList.Create(
                new Card(Color.Green, CardType.One)), false, true, false, 0)),
        DrawPile = ImmutableStack.CreateRange(new[] { new Card(Color.Blue, CardType.Two) }),
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void PlayCard_LegalNumber_MovesToDiscardAndPassesTurn()
    {
        var state = Make(ImmutableList.Create(
            new Card(Color.Red, CardType.Nine), new Card(Color.Blue, CardType.Two)));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));

        result.State.TopCard.Should().Be(new Card(Color.Red, CardType.Nine));
        result.State.PlayerById("p1")!.Hand.Count.Should().Be(1);
        result.State.CurrentPlayer.Id.Should().Be("p2");
        result.Events.Should().Contain(e => e is CardPlayed);
    }

    [Fact]
    public void PlayCard_IllegalCard_IsRejected()
    {
        var state = Make(ImmutableList.Create(new Card(Color.Blue, CardType.Nine)));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
        result.State.Version.Should().Be(0);
    }

    [Fact]
    public void PlayCard_LastCard_EndsRound()
    {
        var state = Make(ImmutableList.Create(new Card(Color.Red, CardType.Nine)));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.Events.Should().Contain(e => e is RoundEnded);
    }

    [Fact]
    public void PlayCard_MultipleSameNumber_WhenRuleOn_PlaysAll()
    {
        var rules = RuleSet.Classic with { SameNumberMultiPlay = true };
        var state = Make(ImmutableList.Create(
            new Card(Color.Red, CardType.Nine),
            new Card(Color.Blue, CardType.Nine)), rules);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0, 1 }));
        result.State.PlayerById("p1")!.Hand.Should().BeEmpty();
        result.State.TopCard.Type.Should().Be(CardType.Nine);
    }

    [Fact]
    public void CallUno_SetsFlag()
    {
        var state = Make(ImmutableList.Create(
            new Card(Color.Red, CardType.Nine), new Card(Color.Red, CardType.One)));
        var result = Engine.Apply(state, new CallUno("p1"));
        result.State.PlayerById("p1")!.HasCalledUno.Should().BeTrue();
    }
}
