using System.Text.Json;
using Uno.Engine.State;
using Uno.Server.Contracts;
using Uno.Server.Rooms;

namespace Uno.Server.Persistence;

public class MatchHistoryWriter
{
    private readonly UnoDbContext _db;

    public MatchHistoryWriter(UnoDbContext db) => _db = db;

    public async Task SaveAsync(MatchHistory history, CancellationToken cancellationToken = default)
    {
        if (history.Id == Guid.Empty)
            history.Id = Guid.NewGuid();

        _db.MatchHistories.Add(history);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveAsync(Room room, GameState finalState, string winnerId, DateTime startedAt,
        CancellationToken cancellationToken = default)
    {
        var winner = finalState.PlayerById(winnerId)!;
        var players = finalState.Players.Select(p => new { p.Id, p.Name, p.Score, p.IsBot }).ToList();
        _db.MatchHistories.Add(new MatchHistory
        {
            Id = Guid.NewGuid(),
            RoomCode = room.Code,
            StartedAt = startedAt,
            EndedAt = DateTime.UtcNow,
            RulesJson = JsonSerializer.Serialize(DtoMappers.ToDto(finalState.Rules)),
            PlayersJson = JsonSerializer.Serialize(players),
            WinnerId = winnerId,
            WinnerName = winner.Name
        });
        await _db.SaveChangesAsync(cancellationToken);
    }
}
