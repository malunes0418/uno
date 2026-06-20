using FluentAssertions;
using Microsoft.AspNetCore.SignalR.Client;
using Uno.Server.Contracts;
using Xunit;

namespace Uno.Server.Tests.Hub;

public class GameHubLobbyTests : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task CreateRoom_EmitsRoomUpdated()
    {
        await using var factory = new TestWebApplicationFactory();
        var hubUrl = new Uri(factory.Server.BaseAddress!, "/hub/game");
        RoomDto? received = null;
        await using var conn = new HubConnectionBuilder()
            .WithUrl(hubUrl, o => o.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler())
            .Build();
        conn.On<RoomDto>("RoomUpdated", r => received = r);
        await conn.StartAsync();
        var result = await conn.InvokeAsync<CreateRoomResult>("CreateRoom",
            new RuleSetDto("None", false, false, false, false, false, false, false), "Alice", "player-1");
        await Task.Delay(200);
        received.Should().NotBeNull();
        received!.Code.Should().Be(result.Code);
        await conn.StopAsync();
    }
}
