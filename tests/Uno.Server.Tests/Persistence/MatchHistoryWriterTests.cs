using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Uno.Engine.State;
using Uno.Server.Actors;
using Uno.Server.Bots;
using Uno.Server.Persistence;
using Uno.Server.Rooms;

namespace Uno.Server.Tests.Persistence;

public class MatchHistoryWriterTests
{
    private static async Task<UnoDbContext> CreateInMemoryOrTestDb()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();

        var options = new DbContextOptionsBuilder<UnoDbContext>()
            .UseSqlite(connection)
            .Options;

        var ctx = new UnoDbContext(options);
        await ctx.Database.EnsureCreatedAsync();
        return ctx;
    }

    [Fact]
    public async Task SaveFinishedGame_PersistsRow()
    {
        await using var ctx = await CreateInMemoryOrTestDb();
        var writer = new MatchHistoryWriter(ctx);
        var startedAt = DateTime.UtcNow.AddMinutes(-10);
        var endedAt = DateTime.UtcNow;

        await writer.SaveAsync(new MatchHistory
        {
            RoomCode = "ABC123",
            StartedAt = startedAt,
            EndedAt = endedAt,
            RulesJson = """{"jumpIn":false}""",
            PlayersJson = """[{"id":"p1","name":"Alice","score":500,"isBot":false}]""",
            WinnerId = "p1",
            WinnerName = "Alice"
        });

        ctx.MatchHistories.Should().HaveCount(1);
        var row = ctx.MatchHistories.Single();
        row.RoomCode.Should().Be("ABC123");
        row.WinnerName.Should().Be("Alice");
        row.StartedAt.Should().Be(startedAt);
        row.EndedAt.Should().Be(endedAt);
    }

    [Fact]
    public async Task GameActor_OnGameEnded_WritesMatchHistory()
    {
        await using var ctx = await CreateInMemoryOrTestDb();
        var writer = new MatchHistoryWriter(ctx);
        var room = new Room { Code = "TEST01", Rules = RuleSet.Classic, HostId = "p1" };
        var startedAt = DateTime.UtcNow;

        var rules = RuleSet.Classic with { CumulativeScoring = true, TargetScore = 1 };

        var actor = new GameActor(
            room.Code,
            rules,
            new[] { ("p1", "A", false), ("p2", "B", false) },
            seed: 7,
            onBroadcast: (_, __, ___, ____) => Task.CompletedTask,
            getViewers: () => Array.Empty<string>(),
            onGameEnded: async state =>
            {
                var winnerId = state.Players.MaxBy(p => p.Score)!.Id;
                await writer.SaveAsync(room, state, winnerId, startedAt);
                room.Status = RoomStatus.Finished;
            });

        await actor.StartAsync();

        for (var i = 0; i < 500 && actor.CurrentState?.Phase != Phase.GameOver; i++)
        {
            var state = actor.CurrentState!;
            var cmd = BotDriver.ChooseCommand(state, state.CurrentPlayer.Id);
            await actor.SubmitAsync(cmd, state.Version);
        }

        actor.CurrentState!.Phase.Should().Be(Phase.GameOver);
        ctx.MatchHistories.Should().HaveCount(1);
        var row = ctx.MatchHistories.Single();
        row.RoomCode.Should().Be("TEST01");
        row.WinnerId.Should().NotBeNullOrEmpty();
        room.Status.Should().Be(RoomStatus.Finished);

        await actor.DisposeAsync();
    }
}
