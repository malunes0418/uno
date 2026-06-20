using FluentAssertions;
using Uno.Engine.State;
using Uno.Server.Rooms;
using Xunit;

namespace Uno.Server.Tests.Rooms;

public class GameRegistryTests
{
    [Fact]
    public void CreateRoom_GeneratesUniqueSixCharCode()
    {
        var reg = new GameRegistry();
        var r1 = reg.CreateRoom(new RuleSet { JumpIn = true }, "host1", "Host");
        var r2 = reg.CreateRoom(RuleSet.Classic, "host2", "Host2");
        r1.Code.Should().HaveLength(6);
        r1.Code.Should().NotBe(r2.Code);
        r1.HostId.Should().Be("host1");
        r1.Status.Should().Be(RoomStatus.Lobby);
    }

    [Fact]
    public void JoinRoom_AddsPlayerUpToMax()
    {
        var reg = new GameRegistry();
        var room = reg.CreateRoom(RuleSet.Classic, "h", "Host");
        reg.JoinRoom(room.Code, "p2", "Guest").Should().BeTrue();
        reg.GetRoom(room.Code)!.Players.Should().HaveCount(2);
    }
}
