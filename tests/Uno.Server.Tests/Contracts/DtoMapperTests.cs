using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Uno.Server.Contracts;
using Xunit;

namespace Uno.Server.Tests.Contracts;

public class DtoMapperTests
{
    [Fact]
    public void ToDto_PlayCard_RoundTrips()
    {
        var cmd = new PlayCard("p1", new[] { 0, 1 });
        var dto = DtoMappers.ToDto(cmd);
        var back = DtoMappers.ToEngine(dto);
        back.Should().BeOfType<PlayCard>().Which.HandIndexes.Should().Equal(0, 1);
    }

    [Fact]
    public void ToDto_CardPlayed_IncludesCards()
    {
        var ev = new CardPlayed("p1", new[] { new Card(Color.Red, CardType.Five) });
        var dto = DtoMappers.ToDto(ev);
        dto.Should().BeOfType<CardPlayedDto>().Which.Cards[0].Color.Should().Be("Red");
    }

    [Fact]
    public void ToDto_RuleSet_MapsStackingMode()
    {
        var rules = new RuleSet { Stacking = StackingMode.TwoAndFourInterchangeable, JumpIn = true };
        var dto = DtoMappers.ToDto(rules);
        dto.Stacking.Should().Be("TwoAndFourInterchangeable");
        dto.JumpIn.Should().BeTrue();
    }
}
