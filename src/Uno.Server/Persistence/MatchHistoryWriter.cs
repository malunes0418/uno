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
}
