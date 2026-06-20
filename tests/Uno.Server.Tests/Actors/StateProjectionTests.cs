using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.State;
using Uno.Server.Actors;
using Uno.Server.Contracts;
using Xunit;

namespace Uno.Server.Tests.Actors;

public class StateProjectionTests
{
    [Fact]
    public void Project_OwnHandFull_OpponentsCountsOnly()
    {
        var p1 = new Player("p1", "A", ImmutableList.Create(new Card(Color.Red, CardType.One)), false, true, false, 0);
        var p2 = new Player("p2", "B", ImmutableList.Create(
            new Card(Color.Blue, CardType.Two), new Card(Color.Green, CardType.Three)), false, true, false, 0);
        var state = MinimalState(p1, p2);
        var dto = StateProjection.Project("ROOM", state, "p1");
        dto.Players.Single(p => p.Id == "p1").Hand.Should().HaveCount(1);
        dto.Players.Single(p => p.Id == "p2").Hand.Should().BeNull();
        dto.Players.Single(p => p.Id == "p2").HandCount.Should().Be(2);
        dto.DrawPileCount.Should().Be(state.DrawPile.Count());
    }

    private static GameState MinimalState(Player p1, Player p2) => new()
    {
        Rules = RuleSet.Classic,
        Players = ImmutableList.Create(p1, p2),
        DrawPile = ImmutableStack.CreateRange(Enumerable.Repeat(new Card(Color.Red, CardType.Nine), 50)),
        DiscardPile = ImmutableList.Create(new Card(Color.Yellow, CardType.Five)),
        ActiveColor = Color.Yellow,
        CurrentPlayerIndex = 0,
        Direction = 1,
        PendingDraw = 0,
        Phase = Phase.AwaitingPlay,
        Version = 3,
        RngSeed = 42,
        RngState = 42
    };
}
