using FluentAssertions;
using Uno.Engine.Commands;
using Uno.Engine.State;
using Uno.Server.Actors;
using Xunit;

namespace Uno.Server.Tests.Actors;

public class GameActorTests
{
    [Fact]
    public async Task SubmitCommand_ValidPlay_IncrementsVersion()
    {
        var tcs = new TaskCompletionSource<int>();
        var actor = new GameActor("ROOM", RuleSet.Classic,
            new[] { ("p1", "A", false), ("p2", "B", false) },
            seed: 7,
            onBroadcast: (_, __, ___, ver) => { tcs.TrySetResult(ver); return Task.CompletedTask; });

        await actor.StartAsync();
        var state = actor.CurrentState!;
        var idx = state.Players[0].Hand.FindIndex(c =>
            c.Color == state.TopCard.Color || c.Type == state.TopCard.Type);
        idx.Should().BeGreaterThanOrEqualTo(0);

        await actor.SubmitAsync(new PlayCard("p1", new[] { idx }), state.Version);
        var ver = await tcs.Task.WaitAsync(TimeSpan.FromSeconds(2));
        ver.Should().Be(state.Version + 1);
        await actor.DisposeAsync();
    }

    [Fact]
    public async Task SubmitCommand_StaleVersion_RejectedWithoutEngineMutation()
    {
        var actor = new GameActor("ROOM", RuleSet.Classic,
            new[] { ("p1", "A", false), ("p2", "B", false) }, 7,
            (_, __, ___, ____) => Task.CompletedTask);
        await actor.StartAsync();
        var before = actor.CurrentState!.Version;
        await actor.SubmitAsync(new DrawCard("p1"), lastSeenVersion: before - 1);
        actor.CurrentState!.Version.Should().Be(before);
        await actor.DisposeAsync();
    }
}
