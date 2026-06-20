using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Internal;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests.Internal;

public class PlayValidationTests
{
    private static readonly Card RedFive = new(Color.Red, CardType.Five);

    [Fact]
    public void IsPlayable_MatchingColor_True()
        => PlayValidation.IsPlayable(new Card(Color.Red, CardType.Nine), RedFive, Color.Red)
            .Should().BeTrue();

    [Fact]
    public void IsPlayable_MatchingType_True()
        => PlayValidation.IsPlayable(new Card(Color.Blue, CardType.Five), RedFive, Color.Red)
            .Should().BeTrue();

    [Fact]
    public void IsPlayable_Wild_AlwaysTrue()
        => PlayValidation.IsPlayable(new Card(Color.Wild, CardType.Wild), RedFive, Color.Red)
            .Should().BeTrue();

    [Fact]
    public void IsPlayable_NoMatch_False()
        => PlayValidation.IsPlayable(new Card(Color.Blue, CardType.Nine), RedFive, Color.Red)
            .Should().BeFalse();

    [Fact]
    public void IsPlayable_RespectsActiveColorAfterWild()
        => PlayValidation.IsPlayable(new Card(Color.Green, CardType.One),
            new Card(Color.Wild, CardType.Wild), Color.Green).Should().BeTrue();

    [Fact]
    public void CanStack_SameType_DrawTwoOnDrawTwo_True()
    {
        var rules = RuleSet.Classic with { Stacking = StackingMode.SameType };
        PlayValidation.CanStack(new Card(Color.Blue, CardType.DrawTwo),
            new Card(Color.Red, CardType.DrawTwo), rules).Should().BeTrue();
    }

    [Fact]
    public void CanStack_None_NeverAllows()
    {
        PlayValidation.CanStack(new Card(Color.Blue, CardType.DrawTwo),
            new Card(Color.Red, CardType.DrawTwo), RuleSet.Classic).Should().BeFalse();
    }

    [Fact]
    public void CanStack_Interchangeable_FourOnTwo_True()
    {
        var rules = RuleSet.Classic with { Stacking = StackingMode.TwoAndFourInterchangeable };
        PlayValidation.CanStack(new Card(Color.Wild, CardType.WildDrawFour),
            new Card(Color.Red, CardType.DrawTwo), rules).Should().BeTrue();
    }
}
