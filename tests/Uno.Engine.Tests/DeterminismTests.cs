using FluentAssertions;
using Uno.Engine.Commands;
using Uno.Engine.Setup;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class DeterminismTests
{
    [Fact]
    public void SameSeedAndCommands_ProduceIdenticalState()
    {
        var seats = new[] { ("p1","P1",false), ("p2","P2",false) };

        GameState Run()
        {
            var s = GameSetup.NewGame(seats, RuleSet.Classic, seed: 12345);
            for (var i = 0; i < 6; i++)
                s = Engine.Apply(s, new DrawCard(s.CurrentPlayer.Id)).State;
            return s;
        }

        Run().Should().BeEquivalentTo(Run());
    }
}
