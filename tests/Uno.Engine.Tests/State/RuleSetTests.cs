using FluentAssertions;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests.State;

public class RuleSetTests
{
    [Fact]
    public void Classic_DefaultsToOfficialRules_AllHouseRulesOff()
    {
        var r = RuleSet.Classic;
        r.Stacking.Should().Be(StackingMode.None);
        r.DrawToMatch.Should().BeFalse();
        r.JumpIn.Should().BeFalse();
        r.SevenZero.Should().BeFalse();
        r.ForcedUnoPenalty.Should().BeFalse();
        r.SameNumberMultiPlay.Should().BeFalse();
        r.CumulativeScoring.Should().BeFalse();
        r.WildDrawFourChallenge.Should().BeFalse();
        r.TargetScore.Should().Be(500);
        r.UnoPenaltyCards.Should().Be(2);
    }

    [Fact]
    public void RuleSet_IsImmutableViaWith()
    {
        var r = RuleSet.Classic with { JumpIn = true, Stacking = StackingMode.SameType };
        r.JumpIn.Should().BeTrue();
        RuleSet.Classic.JumpIn.Should().BeFalse();
    }
}
