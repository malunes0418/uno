using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Xunit;

namespace Uno.Engine.Tests.Cards;

public class DeckFactoryTests
{
    private static ImmutableList<Card> Deck => DeckFactory.CreateStandardDeck();

    [Fact]
    public void CreateStandardDeck_HasExactly108Cards()
        => Deck.Count.Should().Be(108);

    [Fact]
    public void CreateStandardDeck_HasOneZeroPerColor()
    {
        foreach (var c in new[] { Color.Red, Color.Yellow, Color.Green, Color.Blue })
            Deck.Count(x => x.Color == c && x.Type == CardType.Zero).Should().Be(1);
    }

    [Fact]
    public void CreateStandardDeck_HasTwoOfEachOneToNinePerColor()
    {
        foreach (var c in new[] { Color.Red, Color.Yellow, Color.Green, Color.Blue })
            for (var t = CardType.One; t <= CardType.Nine; t++)
                Deck.Count(x => x.Color == c && x.Type == t).Should().Be(2);
    }

    [Fact]
    public void CreateStandardDeck_HasTwoOfEachActionPerColor()
    {
        foreach (var c in new[] { Color.Red, Color.Yellow, Color.Green, Color.Blue })
            foreach (var t in new[] { CardType.Skip, CardType.Reverse, CardType.DrawTwo })
                Deck.Count(x => x.Color == c && x.Type == t).Should().Be(2);
    }

    [Fact]
    public void CreateStandardDeck_HasFourWildAndFourWildDrawFour()
    {
        Deck.Count(x => x.Type == CardType.Wild).Should().Be(4);
        Deck.Count(x => x.Type == CardType.WildDrawFour).Should().Be(4);
        Deck.Where(x => x.IsWild).Should().OnlyContain(x => x.Color == Color.Wild);
    }
}
