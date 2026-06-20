using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Uno.Server.Persistence;

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
}
