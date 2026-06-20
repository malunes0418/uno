using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Internal;
using Uno.Engine.Setup;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests.Setup;

public class GameSetupTests
{
    private static GameState New(int seed = 1) => GameSetup.NewGame(
        new[] { ("p1","P1",false), ("p2","P2",false), ("p3","P3",true) },
        RuleSet.Classic, seed);

    [Fact]
    public void NewGame_DealsSevenCardsToEachPlayer()
        => New().Players.Should().OnlyContain(p => p.Hand.Count == 7);

    [Fact]
    public void NewGame_StartsDiscardWithOneCard()
        => New().DiscardPile.Count.Should().Be(1);

    [Fact]
    public void NewGame_TopCardIsNeverWildDrawFour()
        => New().TopCard.Type.Should().NotBe(CardType.WildDrawFour);

    [Fact]
    public void NewGame_TotalCardsConservedAcross108()
    {
        var s = New();
        var total = s.Players.Sum(p => p.Hand.Count) + s.DrawPile.Count() + s.DiscardPile.Count;
        total.Should().Be(108);
    }

    [Fact]
    public void NewGame_SameSeed_ProducesIdenticalDeal()
    {
        New(99).Should().BeEquivalentTo(New(99));
    }

    [Fact]
    public void NextIndex_WrapsForwardAndBackward()
    {
        TurnMath.NextIndex(2, 1, 3).Should().Be(0);
        TurnMath.NextIndex(0, -1, 3).Should().Be(2);
        TurnMath.NextIndex(0, 1, 3, steps: 2).Should().Be(2);
    }
}
