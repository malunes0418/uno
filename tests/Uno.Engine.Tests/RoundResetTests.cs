using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Setup;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class RoundResetTests
{
    [Fact]
    public void StartNextRound_PreservesScores_RedealsHands()
    {
        var finished = new GameState
        {
            Rules = RuleSet.Classic with { CumulativeScoring = true },
            Players = ImmutableList.Create(
                new Player("p1","P1", ImmutableList<Card>.Empty, false, true, false, 120),
                new Player("p2","P2", ImmutableList.Create(new Card(Color.Red, CardType.One)),
                    false, true, false, 30)),
            DrawPile = ImmutableStack<Card>.Empty,
            DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.One)),
            ActiveColor = Color.Red, CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
            Phase = Phase.RoundOver, Version = 9, RngSeed = 1, RngState = 1
        };

        var next = RoundReset.StartNextRound(finished, seed: 777);
        next.Players.Should().OnlyContain(p => p.Hand.Count == 7);
        next.PlayerById("p1")!.Score.Should().Be(120);
        next.PlayerById("p2")!.Score.Should().Be(30);
        next.Phase.Should().Be(Phase.AwaitingPlay);
    }
}
