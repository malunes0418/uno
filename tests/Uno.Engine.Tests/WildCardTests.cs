using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class WildCardTests
{
    private static GameState Make(Card p1Wild, RuleSet? rules = null) => new()
    {
        Rules = rules ?? RuleSet.Classic,
        Players = ImmutableList.Create(
            new Player("p1","P1", ImmutableList.Create(p1Wild, new Card(Color.Green, CardType.Two)),
                false, true, false, 0),
            new Player("p2","P2", ImmutableList.Create(new Card(Color.Green, CardType.One)),
                false, true, false, 0)),
        DrawPile = ImmutableStack.CreateRange(Enumerable.Range(0, 10)
            .Select(_ => new Card(Color.Blue, CardType.Four))),
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void PlayWild_EntersColorChoicePhase_TurnNotAdvanced()
    {
        var state = Make(new Card(Color.Wild, CardType.Wild));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.State.Phase.Should().Be(Phase.AwaitingColorChoice);
        result.State.CurrentPlayer.Id.Should().Be("p1");
        result.State.PendingWildPlayerId.Should().Be("p1");
    }

    [Fact]
    public void ChooseColor_SetsActiveColorAndAdvancesTurn()
    {
        var state = Make(new Card(Color.Wild, CardType.Wild));
        var afterPlay = Engine.Apply(state, new PlayCard("p1", new[] { 0 })).State;
        var result = Engine.Apply(afterPlay, new ChooseColor("p1", Color.Blue));
        result.State.ActiveColor.Should().Be(Color.Blue);
        result.State.Phase.Should().Be(Phase.AwaitingPlay);
        result.State.CurrentPlayer.Id.Should().Be("p2");
        result.Events.Should().Contain(e => e is ColorChosen);
    }

    [Fact]
    public void WildDrawFour_AddsFourToPendingDraw()
    {
        var state = Make(new Card(Color.Wild, CardType.WildDrawFour));
        var afterPlay = Engine.Apply(state, new PlayCard("p1", new[] { 0 })).State;
        afterPlay.PendingDraw.Should().Be(4);
        var afterColor = Engine.Apply(afterPlay, new ChooseColor("p1", Color.Green)).State;
        afterColor.ActiveColor.Should().Be(Color.Green);
        afterColor.CurrentPlayer.Id.Should().Be("p2");
        afterColor.PendingDraw.Should().Be(4);
    }

    [Fact]
    public void ChooseColor_WhenNotInChoicePhase_IsRejected()
    {
        var state = Make(new Card(Color.Wild, CardType.Wild));
        var result = Engine.Apply(state, new ChooseColor("p1", Color.Blue));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
    }
}
