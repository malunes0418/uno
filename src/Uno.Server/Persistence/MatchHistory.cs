namespace Uno.Server.Persistence;

public class MatchHistory
{
    public Guid Id { get; set; }
    public string RoomCode { get; set; } = "";
    public DateTime StartedAt { get; set; }
    public DateTime EndedAt { get; set; }
    public string RulesJson { get; set; } = "";
    public string PlayersJson { get; set; } = "";
    public string WinnerId { get; set; } = "";
    public string WinnerName { get; set; } = "";
    public string? UserId { get; set; }
}
