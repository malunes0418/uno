using Uno.Engine.State;
using Uno.Server.Actors;

namespace Uno.Server.Rooms;

public class Room
{
    public required string Code { get; init; }
    public required RuleSet Rules { get; set; }
    public required string HostId { get; set; }
    public RoomStatus Status { get; set; } = RoomStatus.Lobby;
    public List<LobbyPlayer> Players { get; } = new();
    // GameActor defined in Task 6
    public GameActor? Actor { get; set; }
}

public record LobbyPlayer(string Id, string Name, bool IsBot, bool Connected);
