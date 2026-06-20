using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.State;
using Uno.Server.Bots;
using Xunit;

namespace Uno.Server.Tests.Bots;

public class BotDriverTests
{
    [Fact]
    public void ChooseCommand_OnBotTurn_PlaysMatchingCardIfPossible()
    {
        var bot = new Player("bot1", "Bot",
            ImmutableList.Create(
                new Card(Color.Red, CardType.Five),
                new Card(Color.Blue, CardType.Nine)),
            false, true, true, 0);
        var human = new Player("p2", "Human",
            ImmutableList.Create(new Card(Color.Blue, CardType.Nine)), false, true, false, 0);
        var state = new GameState
        {
            Rules = RuleSet.Classic,
            Players = ImmutableList.Create(bot, human),
            DrawPile = ImmutableStack.CreateRange(Enumerable.Repeat(new Card(Color.Green, CardType.One), 50)),
            DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Seven)),
            ActiveColor = Color.Red,
            CurrentPlayerIndex = 0,
            Direction = 1,
            PendingDraw = 0,
            Phase = Phase.AwaitingPlay,
            Version = 1,
            RngSeed = 42,
            RngState = 42
        };

        var cmd = BotDriver.ChooseCommand(state, state.CurrentPlayer.Id);

        cmd.Should().BeOfType<PlayCard>();
    }
}
