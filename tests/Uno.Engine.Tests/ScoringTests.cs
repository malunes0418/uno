using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.Internal;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class ScoringTests
{
    private static GameState NearWin(RuleSet rules, int p1Score = 0) => new()
    {
        Rules = rules,
        Players = ImmutableList.Create(
            new Player("p1","P1", ImmutableList.Create(new Card(Color.Red, CardType.Nine)),
                false, true, false, p1Score),
            new Player("p2","P2", ImmutableList.Create(
                new Card(Color.Blue, CardType.Seven),
                new Card(Color.Wild, CardType.Wild)),
                false, true, false, 0)),
        DrawPile = ImmutableStack.CreateRange(new[] { new Card(Color.Blue, CardType.Two) }),
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void RoundScores_WinnerGainsOpponentsHandTotal()
    {
        var state = NearWin(RuleSet.Classic);
        var scores = Scoring.RoundScores(state, "p1");
        scores["p1"].Should().Be(57);
    }

    [Fact]
    public void PlayLastCard_NonCumulative_EndsGame()
    {
        var state = NearWin(RuleSet.Classic);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.Events.Should().Contain(e => e is GameEnded);
        result.State.Phase.Should().Be(Phase.GameOver);
    }

    [Fact]
    public void PlayLastCard_Cumulative_BelowTarget_EndsRoundNotGame()
    {
        var rules = RuleSet.Classic with { CumulativeScoring = true, TargetScore = 500 };
        var state = NearWin(rules);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.Events.Should().Contain(e => e is RoundEnded);
        result.Events.Should().NotContain(e => e is GameEnded);
        result.State.Phase.Should().Be(Phase.RoundOver);
        result.State.PlayerById("p1")!.Score.Should().Be(57);
    }

    [Fact]
    public void PlayLastCard_Cumulative_ReachesTarget_EndsGame()
    {
        var rules = RuleSet.Classic with { CumulativeScoring = true, TargetScore = 500 };
        var state = NearWin(rules, p1Score: 450);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.Events.Should().Contain(e => e is GameEnded);
        result.State.Phase.Should().Be(Phase.GameOver);
    }
}
