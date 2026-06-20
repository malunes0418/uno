using System.Collections.Concurrent;

namespace Uno.Server.Sessions;

public class ConnectionRegistry
{
    private readonly ConcurrentDictionary<string, PlayerToken> _byPlayer = new();
    private readonly ConcurrentDictionary<string, string> _connectionToPlayer = new();
    private readonly ConcurrentDictionary<string, string> _playerToConnection = new();

    public void RegisterPlayer(string roomCode, string playerId, string displayName)
        => _byPlayer[playerId] = new PlayerToken(playerId, displayName, roomCode);

    public void MapConnection(string roomCode, string playerId, string connectionId)
    {
        if (_playerToConnection.TryGetValue(playerId, out var old))
            _connectionToPlayer.TryRemove(old, out _);
        _playerToConnection[playerId] = connectionId;
        _connectionToPlayer[connectionId] = playerId;
        if (_byPlayer.TryGetValue(playerId, out var tok))
            _byPlayer[playerId] = tok with { RoomCode = roomCode };
    }

    public void Disconnect(string connectionId)
    {
        if (!_connectionToPlayer.TryRemove(connectionId, out var playerId)) return;
        _playerToConnection.TryRemove(playerId, out _);
    }

    public string? GetPlayerId(string connectionId)
        => _connectionToPlayer.GetValueOrDefault(connectionId);

    public string? GetDisplayName(string playerId)
        => _byPlayer.GetValueOrDefault(playerId)?.DisplayName;

    public IReadOnlyList<string> GetConnectionIds(string roomCode, string playerId)
    {
        if (!_playerToConnection.TryGetValue(playerId, out var conn)) return Array.Empty<string>();
        if (_byPlayer.GetValueOrDefault(playerId)?.RoomCode != roomCode) return Array.Empty<string>();
        return new[] { conn };
    }

    public string? GetRoomForConnection(string connectionId)
    {
        var pid = GetPlayerId(connectionId);
        return pid is null ? null : _byPlayer.GetValueOrDefault(pid)?.RoomCode;
    }
}
