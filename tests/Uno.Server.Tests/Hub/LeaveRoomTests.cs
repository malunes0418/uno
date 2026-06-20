using FluentAssertions;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Uno.Server.Contracts;
using Uno.Server.Rooms;
using Xunit;

namespace Uno.Server.Tests.Hub;

public class LeaveRoomTests : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task LeaveRoom_LastPlayer_DisposesRoom()
    {
        await using var factory = new TestWebApplicationFactory();
        var registry = factory.Services.GetRequiredService<GameRegistry>();
        var hubUrl = new Uri(factory.Server.BaseAddress!, "/hub/game");
        await using var conn = new HubConnectionBuilder()
            .WithUrl(hubUrl, o => o.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler())
            .Build();
        await conn.StartAsync();
        var rules = new RuleSetDto("None", false, false, false, false, false, false, false);
        var created = await conn.InvokeAsync<CreateRoomResult>("CreateRoom", rules, "Alice", "player-1");
        registry.GetRoom(created.Code).Should().NotBeNull();

        await conn.InvokeAsync("LeaveRoom", created.Code);

        registry.GetRoom(created.Code).Should().BeNull();
        await conn.StopAsync();
    }
}
