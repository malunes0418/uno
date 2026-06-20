using FluentAssertions;
using Uno.Engine;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.Setup;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class DrawCardTests
{
    private static GameState TwoPlayerGame(int seed = 3) => GameSetup.NewGame(
        new[] { ("p1","P1",false), ("p2","P2",false) }, RuleSet.Classic, seed);

    [Fact]
    public void Draw_NormalTurn_AddsOneCardAndPassesTurn()
    {
        var state = TwoPlayerGame();
        var current = state.CurrentPlayer.Id;
        var before = state.CurrentPlayer.Hand.Count;

        var result = Engine.Apply(state, new DrawCard(current));

        result.State.PlayerById(current)!.Hand.Count.Should().Be(before + 1);
        result.State.CurrentPlayer.Id.Should().NotBe(current);
        result.Events.Should().Contain(e => e is CardsDrawn);
        result.Events.Should().Contain(e => e is TurnPassed);
        result.State.Version.Should().Be(state.Version + 1);
    }

    [Fact]
    public void Draw_WithPendingDraw_DrawsAccumulatedTotal()
    {
        var state = TwoPlayerGame() with { PendingDraw = 4 };
        var current = state.CurrentPlayer.Id;
        var before = state.CurrentPlayer.Hand.Count;

        var result = Engine.Apply(state, new DrawCard(current));

        result.State.PlayerById(current)!.Hand.Count.Should().Be(before + 4);
        result.State.PendingDraw.Should().Be(0);
    }
}
