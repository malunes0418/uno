using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.State;
using Uno.Server.Actors;
using Uno.Server.Contracts;
using Xunit;

namespace Uno.Server.Tests.Actors;

public class JumpInRaceTests
{
    // Seed 17: p1 plays wild + chooses Red, p2/p3 draw; p1 to act with Wild on top.
    // p2 (hand idx 3) and p3 (hand idx 0) each hold a Wild identical to the top card.
    private const int Seed = 17;

    [Fact]
    public async Task JumpInRace_FirstWins_SecondRejected()
    {
        var rules = new RuleSet { JumpIn = true };
        var events = new List<GameEventDto>();
        var actor = new GameActor(
            "ROOM",
            rules,
            new[] { ("p1", "A", false), ("p2", "B", false), ("p3", "C", false) },
            Seed,
            (viewerId, _, ev, ___) =>
            {
                if (viewerId == "p1")
                    events.AddRange(ev);
                return Task.CompletedTask;
            },
            () => new[] { "p1", "p2", "p3" });

        await actor.StartAsync();
        await ArrangeJumpInWindowAsync(actor);

        var state = actor.CurrentState!;
        state.CurrentPlayer.Id.Should().Be("p1");
        state.Phase.Should().Be(Phase.AwaitingPlay);
        state.TopCard.Should().Be(new Card(Color.Wild, CardType.Wild));

        var idx2 = state.PlayerById("p2")!.Hand.ToList().FindIndex(c => c == state.TopCard);
        var idx3 = state.PlayerById("p3")!.Hand.ToList().FindIndex(c => c == state.TopCard);
        idx2.Should().BeGreaterThanOrEqualTo(0);
        idx3.Should().BeGreaterThanOrEqualTo(0);

        events.Clear();
        var ver = state.Version;
        var versionBefore = ver;

        await Task.WhenAll(
            actor.SubmitAsync(new PlayCard("p2", new[] { idx2 }), ver),
            actor.SubmitAsync(new PlayCard("p3", new[] { idx3 }), ver));

        actor.CurrentState!.Version.Should().Be(versionBefore + 1);
        events.OfType<CommandRejectedDto>().Should().HaveCount(1);
        events.OfType<CardPlayedDto>().Should().ContainSingle();

        await actor.DisposeAsync();
    }

    private static async Task ArrangeJumpInWindowAsync(GameActor actor)
    {
        var state = actor.CurrentState!;
        await actor.SubmitAsync(new PlayCard("p1", new[] { 1 }), state.Version);

        state = actor.CurrentState!;
        await actor.SubmitAsync(new ChooseColor("p1", Color.Red), state.Version);

        state = actor.CurrentState!;
        await actor.SubmitAsync(new DrawCard("p2"), state.Version);

        state = actor.CurrentState!;
        await actor.SubmitAsync(new DrawCard("p3"), state.Version);
    }
}
