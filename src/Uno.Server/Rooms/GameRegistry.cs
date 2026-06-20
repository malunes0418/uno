using System.Collections.Concurrent;
using System.Security.Cryptography;
using Uno.Engine.State;

namespace Uno.Server.Rooms;

public class GameRegistry
{
    public const int MaxPlayers = 6;
    private static readonly char[] CodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".ToCharArray();
    private readonly ConcurrentDictionary<string, Room> _rooms = new();

    public Room CreateRoom(RuleSet rules, string hostId, string hostName)
    {
        var code = GenerateCode();
        var room = new Room
        {
            Code = code,
            Rules = rules,
            HostId = hostId,
            Players = { new LobbyPlayer(hostId, hostName, false, true) }
        };
        _rooms[code] = room;
        return room;
    }

    public bool JoinRoom(string code, string playerId, string name)
    {
        if (!_rooms.TryGetValue(code, out var room)) return false;
        if (room.Status != RoomStatus.Lobby) return false;
        if (room.Players.Count >= MaxPlayers) return false;
        if (room.Players.Any(p => p.Id == playerId)) return true;
        room.Players.Add(new LobbyPlayer(playerId, name, false, true));
        return true;
    }

    public bool AddBot(string code, string hostId)
    {
        if (!_rooms.TryGetValue(code, out var room)) return false;
        if (room.HostId != hostId || room.Status != RoomStatus.Lobby) return false;
        if (room.Players.Count >= MaxPlayers) return false;
        var botId = $"bot-{Guid.NewGuid():N}"[..12];
        room.Players.Add(new LobbyPlayer(botId, $"Bot {room.Players.Count(p => p.IsBot) + 1}", true, true));
        return true;
    }

    public Room? GetRoom(string code) => _rooms.GetValueOrDefault(code);

    public void RemoveRoom(string code) => _rooms.TryRemove(code, out _);

    private string GenerateCode()
    {
        Span<char> buf = stackalloc char[6];
        do
        {
            for (var i = 0; i < 6; i++)
                buf[i] = CodeChars[RandomNumberGenerator.GetInt32(CodeChars.Length)];
        } while (_rooms.ContainsKey(new string(buf)));
        return new string(buf);
    }
}
