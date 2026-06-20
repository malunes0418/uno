using FluentAssertions;
using Uno.Server.Sessions;
using Xunit;

namespace Uno.Server.Tests.Sessions;

public class ConnectionRegistryTests
{
    [Fact]
    public void MapConnection_TwiceSamePlayer_ReplacesOldConnection()
    {
        var reg = new ConnectionRegistry();
        reg.RegisterPlayer("ROOM1", "p1", "Alice");
        reg.MapConnection("ROOM1", "p1", "conn-a");
        reg.MapConnection("ROOM1", "p1", "conn-b");
        reg.GetConnectionIds("ROOM1", "p1").Should().Equal("conn-b");
    }

    [Fact]
    public void Disconnect_RemovesConnectionOnly()
    {
        var reg = new ConnectionRegistry();
        reg.RegisterPlayer("ROOM1", "p1", "Alice");
        reg.MapConnection("ROOM1", "p1", "conn-a");
        reg.Disconnect("conn-a");
        reg.GetConnectionIds("ROOM1", "p1").Should().BeEmpty();
        reg.GetDisplayName("p1").Should().Be("Alice");
    }
}
