using FluentAssertions;
using Uno.Engine.Cards;
using Xunit;

namespace Uno.Engine.Tests.Cards;

public class CardTests
{
    [Fact]
    public void ScoreValue_NumberCard_IsFaceValue()
    {
        new Card(Color.Red, CardType.Seven).ScoreValue.Should().Be(7);
        new Card(Color.Blue, CardType.Zero).ScoreValue.Should().Be(0);
    }

    [Fact]
    public void ScoreValue_ActionCard_Is20()
    {
        new Card(Color.Green, CardType.Skip).ScoreValue.Should().Be(20);
        new Card(Color.Yellow, CardType.DrawTwo).ScoreValue.Should().Be(20);
    }

    [Fact]
    public void ScoreValue_WildCard_Is50()
    {
        new Card(Color.Wild, CardType.Wild).ScoreValue.Should().Be(50);
        new Card(Color.Wild, CardType.WildDrawFour).ScoreValue.Should().Be(50);
    }

    [Fact]
    public void Classification_Flags_AreCorrect()
    {
        new Card(Color.Red, CardType.Five).IsNumber.Should().BeTrue();
        new Card(Color.Red, CardType.Skip).IsAction.Should().BeTrue();
        new Card(Color.Wild, CardType.WildDrawFour).IsWild.Should().BeTrue();
    }
}
