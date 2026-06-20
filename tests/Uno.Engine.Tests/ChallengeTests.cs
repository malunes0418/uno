using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class ChallengeTests
{
    private static GameState Make(bool p1HasMatch)
    {
        var p1Hand = ImmutableList.Create(
            new Card(Color.Wild, CardType.WildDrawFour),
            p1HasMatch ? new Card(Color.Red, CardType.Three) : new Card(Color.Blue, CardType.Three));
        return new GameState
        {
            Rules = RuleSet.Classic with { WildDrawFourChallenge = true },
            Players = ImmutableList.Create(
                new Player("p1","P1", p1Hand, false, true, false, 0),
                new Player("p2","P2", ImmutableList.Create(new Card(Color.Green, CardType.One)),
                    false, true, false, 0)),
            DrawPile = ImmutableStack.CreateRange(Enumerable.Range(0, 12)
                .Select(_ => new Card(Color.Blue, CardType.Four))),
            DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
            ActiveColor = Color.Red,
            CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
            Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
        };
    }

    private static GameState PlayWd4ThenColor(GameState s)
    {
        var afterPlay = Engine.Apply(s, new PlayCard("p1", new[] { 0 })).State;
        return Engine.Apply(afterPlay, new ChooseColor("p1", Color.Green)).State;
    }

    [Fact]
    public void AfterWd4Color_NextPlayerEntersChallengePhase()
    {
        var state = PlayWd4ThenColor(Make(p1HasMatch: true));
        state.Phase.Should().Be(Phase.AwaitingChallenge);
        state.CurrentPlayer.Id.Should().Be("p2");
    }

    [Fact]
    public void Challenge_WhenPlayerHadMatch_PunishesPlayer()
    {
        var state = PlayWd4ThenColor(Make(p1HasMatch: true));
        var result = Engine.Apply(state, new Challenge("p2"));
        result.State.PlayerById("p1")!.Hand.Count.Should().Be(1 + 4);
        result.State.PendingDraw.Should().Be(0);
        result.State.CurrentPlayer.Id.Should().Be("p2");
        result.Events.Should().Contain(e => e is PenaltyApplied);
    }

    [Fact]
    public void Challenge_WhenPlayerHadNoMatch_PunishesChallenger()
    {
        var state = PlayWd4ThenColor(Make(p1HasMatch: false));
        var result = Engine.Apply(state, new Challenge("p2"));
        result.State.PlayerById("p2")!.Hand.Count.Should().Be(1 + 6);
        result.State.CurrentPlayer.Id.Should().Be("p1");
    }

    [Fact]
    public void AcceptWd4ByDrawing_DrawsFourNoChallenge()
    {
        var state = PlayWd4ThenColor(Make(p1HasMatch: true));
        var result = Engine.Apply(state, new DrawCard("p2"));
        result.State.PlayerById("p2")!.Hand.Count.Should().Be(1 + 4);
        result.State.Challenge.Should().BeNull();
    }
}
