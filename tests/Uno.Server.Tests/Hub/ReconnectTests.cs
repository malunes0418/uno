using FluentAssertions;
using Microsoft.AspNetCore.SignalR.Client;
using Uno.Server.Contracts;
using Xunit;

namespace Uno.Server.Tests.Hub;

public class ReconnectTests : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task Reconnect_ResendsSnapshot()
    {
        await using var factory = new TestWebApplicationFactory();
        var hubUrl = new Uri(factory.Server.BaseAddress!, "/hub/game");
        ClientGameStateDto? state = null;
        await using var conn = new HubConnectionBuilder()
            .WithUrl(hubUrl, o => o.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler())
            .Build();
        conn.On<ClientGameStateDto>("GameStateUpdated", s => state = s);
        await conn.StartAsync();
        var rules = new RuleSetDto("None", false, false, false, false, false, false, false);
        var created = await conn.InvokeAsync<CreateRoomResult>("CreateRoom", rules, "Host", "host-1");
        await conn.InvokeAsync("AddBot", created.Code);
        await conn.InvokeAsync("StartGame", created.Code);
        await Task.Delay(200);
        var version = state!.Version;
        await conn.StopAsync();

        await using var conn2 = new HubConnectionBuilder()
            .WithUrl(hubUrl, o => o.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler())
            .Build();
        conn2.On<ClientGameStateDto>("GameStateUpdated", s => state = s);
        await conn2.StartAsync();
        await conn2.InvokeAsync("Reconnect", created.Code, "host-1", "Host");
        await Task.Delay(200);
        state!.Version.Should().Be(version);
        await conn2.StopAsync();
    }
}
