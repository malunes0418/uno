using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Uno.Engine.Commands;
using Uno.Engine.State;
using Uno.Server.Actors;
using Uno.Server.Contracts;
using Uno.Server.Options;
using Uno.Server.Persistence;
using Uno.Server.Rooms;
using Uno.Server.Sessions;

namespace Uno.Server.Hub;

public class GameHub : Microsoft.AspNetCore.SignalR.Hub
{
    private readonly GameRegistry _registry;
    private readonly ConnectionRegistry _connections;
    private readonly DisconnectMonitor _disconnectMonitor;
    private readonly MatchHistoryWriter? _matchHistoryWriter;
    private readonly GameOptions _gameOptions;

    public GameHub(
        GameRegistry registry,
        ConnectionRegistry connections,
        DisconnectMonitor disconnectMonitor,
        IOptions<GameOptions> gameOptions,
        MatchHistoryWriter? matchHistoryWriter = null)
    {
        _registry = registry;
        _connections = connections;
        _disconnectMonitor = disconnectMonitor;
        _gameOptions = gameOptions.Value;
        _matchHistoryWriter = matchHistoryWriter;
    }

    public async Task<CreateRoomResult> CreateRoom(RuleSetDto rulesDto, string displayName, string playerId)
    {
        var rules = DtoMappers.ToEngine(rulesDto);
        var room = _registry.CreateRoom(rules, playerId, displayName);
        _connections.RegisterPlayer(room.Code, playerId, displayName);
        _connections.MapConnection(room.Code, playerId, Context.ConnectionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code);
        await BroadcastRoom(room);
        return new CreateRoomResult(room.Code, playerId);
    }

    public async Task<JoinRoomResult> JoinRoom(string code, string displayName, string playerId)
    {
        if (!_registry.JoinRoom(code, playerId, displayName))
            throw new HubException("Cannot join room.");
        _connections.RegisterPlayer(code, playerId, displayName);
        _connections.MapConnection(code, playerId, Context.ConnectionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, code);
        await BroadcastRoom(_registry.GetRoom(code)!);
        return new JoinRoomResult(playerId);
    }

    public async Task AddBot(string code)
    {
        var playerId = _connections.GetPlayerId(Context.ConnectionId)!;
        var room = _registry.GetRoom(code)!;
        if (!_registry.AddBot(code, playerId))
            throw new HubException("Cannot add bot.");
        await BroadcastRoom(room);
    }

    public async Task StartGame(string code)
    {
        var playerId = _connections.GetPlayerId(Context.ConnectionId)!;
        var room = _registry.GetRoom(code) ?? throw new HubException("Room not found.");
        if (room.HostId != playerId) throw new HubException("Only host can start.");
        if (room.Status != RoomStatus.Lobby) throw new HubException("Already started.");
        if (room.Players.Count < 2) throw new HubException("Need at least 2 players.");

        var seats = room.Players.Select(p => (p.Id, p.Name, p.IsBot)).ToList();
        var seed = Random.Shared.Next();
        room.GameStartedAt = DateTime.UtcNow;
        room.Actor = new GameActor(code, room.Rules, seats, seed,
            onBroadcast: async (viewerId, dto, events, version) =>
            {
                var conns = _connections.GetConnectionIds(code, viewerId);
                foreach (var c in conns)
                    await Clients.Client(c).SendAsync("GameStateUpdated", dto);
                await Clients.Group(code).SendAsync("GameEvents", new GameEventBatchDto(version, events));
            },
            getViewers: () => room.Players.Where(p => !p.IsBot).Select(p => p.Id).ToList(),
            onGameEnded: async state =>
            {
                if (_matchHistoryWriter is not null)
                {
                    var winnerId = state.Players.MaxBy(p => p.Score)!.Id;
                    await _matchHistoryWriter.SaveAsync(room, state, winnerId, room.GameStartedAt!.Value);
                }
                room.Status = RoomStatus.Finished;
                await BroadcastRoom(room);
            },
            options: _gameOptions);

        await room.Actor.StartAsync();
        room.Status = RoomStatus.InGame;
        await BroadcastRoom(room);
        foreach (var human in room.Players.Where(p => !p.IsBot))
        {
            var dto = StateProjection.Project(code, room.Actor.CurrentState!, human.Id);
            foreach (var c in _connections.GetConnectionIds(code, human.Id))
                await Clients.Client(c).SendAsync("GameStateUpdated", dto);
        }
    }

    public async Task SendCommand(string code, CommandDto commandDto, int lastSeenVersion)
    {
        var room = _registry.GetRoom(code) ?? throw new HubException("Room not found.");
        if (room.Actor is null) throw new HubException("Game not started.");
        var cmd = DtoMappers.ToEngine(commandDto);
        await room.Actor.SubmitAsync(cmd, lastSeenVersion);
    }

    public async Task LeaveRoom(string code)
    {
        var playerId = _connections.GetPlayerId(Context.ConnectionId)!;
        var room = _registry.GetRoom(code);
        if (room is null) return;
        room.Players.RemoveAll(p => p.Id == playerId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, code);
        if (room.Players.Count == 0 || room.Status == RoomStatus.Finished)
        {
            if (room.Actor is not null) await room.Actor.DisposeAsync();
            _registry.RemoveRoom(code);
            return;
        }
        await BroadcastRoom(room);
    }

    public async Task Reconnect(string code, string playerId, string displayName)
    {
        var room = _registry.GetRoom(code) ?? throw new HubException("Room not found.");
        _connections.RegisterPlayer(code, playerId, displayName);
        _connections.MapConnection(code, playerId, Context.ConnectionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, code);
        SetPlayerConnected(room, playerId, connected: true);
        _disconnectMonitor.Cancel(code, playerId);
        if (room.Actor?.CurrentState is GameState gs)
        {
            var dto = StateProjection.Project(code, gs, playerId);
            await Clients.Caller.SendAsync("GameStateUpdated", dto);
        }
        else
        {
            await Clients.Caller.SendAsync("RoomUpdated", ToRoomDto(room));
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var roomCode = _connections.GetRoomForConnection(Context.ConnectionId);
        var playerId = _connections.GetPlayerId(Context.ConnectionId);
        _connections.Disconnect(Context.ConnectionId);
        if (roomCode is not null && playerId is not null)
        {
            var room = _registry.GetRoom(roomCode);
            if (room is not null)
            {
                SetPlayerConnected(room, playerId, connected: false);
                _disconnectMonitor.Schedule(roomCode, playerId,
                    TimeSpan.FromSeconds(_gameOptions.DisconnectTimeoutSeconds), async () =>
                {
                    if (room.Actor?.CurrentState is { } s && s.CurrentPlayer.Id == playerId)
                        await room.Actor.SubmitAsync(new DrawCard(playerId), s.Version);
                });
            }
        }
        await base.OnDisconnectedAsync(exception);
    }

    private static void SetPlayerConnected(Room room, string playerId, bool connected)
    {
        var index = room.Players.FindIndex(p => p.Id == playerId);
        if (index >= 0)
            room.Players[index] = room.Players[index] with { Connected = connected };
    }

    private async Task BroadcastRoom(Room room)
    {
        var dto = ToRoomDto(room);
        await Clients.Group(room.Code).SendAsync("RoomUpdated", dto);
    }

    internal static RoomDto ToRoomDto(Room room) => new(
        room.Code,
        DtoMappers.ToDto(room.Rules),
        room.Players.Select(p => new RoomPlayerDto(p.Id, p.Name, p.IsBot, p.Connected, p.Id == room.HostId)).ToList(),
        room.HostId,
        room.Status.ToString());
}
