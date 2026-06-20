using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Rng;
using Xunit;

namespace Uno.Engine.Tests.Rng;

public class DeterministicRngTests
{
    [Fact]
    public void Shuffle_SameSeed_ProducesSameOrder()
    {
        var deck = DeckFactory.CreateStandardDeck();
        var a = new DeterministicRng(42).Shuffle(deck);
        var b = new DeterministicRng(42).Shuffle(deck);
        a.Should().Equal(b);
    }

    [Fact]
    public void Shuffle_DifferentSeed_ProducesDifferentOrder()
    {
        var deck = DeckFactory.CreateStandardDeck();
        var a = new DeterministicRng(1).Shuffle(deck);
        var b = new DeterministicRng(2).Shuffle(deck);
        a.Should().NotEqual(b);
    }

    [Fact]
    public void Shuffle_IsPermutation_PreservesAllCards()
    {
        var deck = DeckFactory.CreateStandardDeck();
        var shuffled = new DeterministicRng(7).Shuffle(deck);
        shuffled.Should().BeEquivalentTo(deck);
    }
}
