using FluentAssertions;
using Microsoft.AspNetCore.SignalR.Client;
using Uno.Server.Contracts;
using Xunit;

namespace Uno.Server.Tests.Hub;

public class GameHubGameFlowTests : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task StartGame_EmitsGameStateUpdated()
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
        await Task.Delay(300);
        state.Should().NotBeNull();
        state!.Version.Should().Be(0);
        state.Players.Should().HaveCountGreaterThanOrEqualTo(2);
        await conn.StopAsync();
    }
}
