using System.Threading.Channels;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.Setup;
using Uno.Engine.State;
using Uno.Server.Bots;
using Uno.Server.Contracts;
using Uno.Server.Options;

namespace Uno.Server.Actors;

public class GameActor : IAsyncDisposable
{
    private readonly Channel<ActorMessage> _channel = Channel.CreateUnbounded<ActorMessage>(
        new UnboundedChannelOptions { SingleReader = true, SingleWriter = false });
    private readonly string _roomCode;
    private readonly Func<string, ClientGameStateDto, IReadOnlyList<GameEventDto>, int, Task> _onBroadcast;
    private readonly Func<IReadOnlyList<string>> _getViewers;
    private readonly Func<GameState, Task>? _onGameEnded;
    private readonly GameOptions _options;
    private GameState? _state;
    private Task? _loop;
    private CancellationTokenSource? _cts;

    public GameState? CurrentState => _state;

    public GameActor(
        string roomCode,
        RuleSet rules,
        IReadOnlyList<(string Id, string Name, bool IsBot)> seats,
        int seed,
        Func<string, ClientGameStateDto, IReadOnlyList<GameEventDto>, int, Task> onBroadcast,
        Func<IReadOnlyList<string>> getViewers,
        Func<GameState, Task>? onGameEnded = null,
        GameOptions? options = null)
    {
        _roomCode = roomCode;
        _onBroadcast = onBroadcast;
        _getViewers = getViewers;
        _onGameEnded = onGameEnded;
        _options = options ?? new GameOptions();
        _state = GameSetup.NewGame(seats, rules, seed);
    }

    public Task StartAsync()
    {
        _cts = new CancellationTokenSource();
        _loop = Task.Run(() => RunAsync(_cts.Token));
        return Task.CompletedTask;
    }

    public async Task SubmitAsync(Command command, int lastSeenVersion)
    {
        var ack = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        await _channel.Writer.WriteAsync(new ActorMessage(command, lastSeenVersion, ack));
        await ack.Task;
    }

    private async Task RunAsync(CancellationToken ct)
    {
        await foreach (var msg in _channel.Reader.ReadAllAsync(ct))
        {
            try
            {
                if (_state is null) { msg.Ack.SetResult(false); continue; }

                if (msg.LastSeenVersion != _state.Version)
                {
                    var reject = new CommandRejected(msg.Command.PlayerId, "Stale version.");
                    await Broadcast(_state, new[] { reject });
                    msg.Ack.SetResult(false);
                    continue;
                }

                var result = Uno.Engine.Engine.Apply(_state, msg.Command);
                _state = result.State;
                await Broadcast(_state, result.Events);
                ScheduleBotTurnIfNeeded(_state);
                msg.Ack.SetResult(true);
            }
            catch (Exception ex)
            {
                msg.Ack.SetException(ex);
            }
        }
    }

    private async Task Broadcast(GameState state, IReadOnlyList<GameEvent> events)
    {
        var eventDtos = events.Select(DtoMappers.ToDto).ToList();
        foreach (var viewerId in _getViewers())
        {
            var dto = StateProjection.Project(_roomCode, state, viewerId);
            await _onBroadcast(viewerId, dto, eventDtos, state.Version);
        }

        if (events.OfType<GameEnded>().Any() && _onGameEnded is not null)
            await _onGameEnded(_state!);

        if (events.OfType<RoundEnded>().Any() && events.OfType<GameEnded>().Any() is false
            && _state?.Phase == Phase.RoundOver)
        {
            _state = RoundReset.StartNextRound(_state, Random.Shared.Next());
            await BroadcastStateOnly(_state);
            ScheduleBotTurnIfNeeded(_state);
        }
    }

    private async Task BroadcastStateOnly(GameState state)
    {
        foreach (var viewerId in _getViewers())
        {
            var dto = StateProjection.Project(_roomCode, state, viewerId);
            await _onBroadcast(viewerId, dto, Array.Empty<GameEventDto>(), state.Version);
        }
    }

    private void ScheduleBotTurnIfNeeded(GameState state)
    {
        if (!state.CurrentPlayer.IsBot) return;

        var botId = state.CurrentPlayer.Id;
        var version = state.Version;
        var delayMs = Random.Shared.Next(_options.BotMinDelayMs, _options.BotMaxDelayMs + 1);

        _ = Task.Run(async () =>
        {
            await Task.Delay(delayMs);
            if (_state is null || _state.Version != version || _state.CurrentPlayer.Id != botId)
                return;

            var command = BotDriver.ChooseCommand(_state, botId);
            await SubmitAsync(command, version);
        });
    }

    public async ValueTask DisposeAsync()
    {
        _channel.Writer.TryComplete();
        _cts?.Cancel();
        if (_loop is not null) await _loop;
        _cts?.Dispose();
    }
}
