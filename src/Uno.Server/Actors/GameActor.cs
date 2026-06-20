using System.Threading.Channels;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.Setup;
using Uno.Engine.State;
using Uno.Server.Contracts;

namespace Uno.Server.Actors;

public class GameActor : IAsyncDisposable
{
    private readonly Channel<ActorMessage> _channel = Channel.CreateUnbounded<ActorMessage>(
        new UnboundedChannelOptions { SingleReader = true, SingleWriter = false });
    private readonly string _roomCode;
    private readonly Func<string, ClientGameStateDto, IReadOnlyList<GameEventDto>, int, Task> _onBroadcast;
    private GameState? _state;
    private Task? _loop;
    private CancellationTokenSource? _cts;

    public GameState? CurrentState => _state;

    public GameActor(
        string roomCode,
        RuleSet rules,
        IReadOnlyList<(string Id, string Name, bool IsBot)> seats,
        int seed,
        Func<string, ClientGameStateDto, IReadOnlyList<GameEventDto>, int, Task> onBroadcast)
    {
        _roomCode = roomCode;
        _onBroadcast = onBroadcast;
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
        var viewerDto = StateProjection.Project(_roomCode, state, state.CurrentPlayer.Id);
        await _onBroadcast(state.CurrentPlayer.Id, viewerDto, eventDtos, state.Version);
    }

    public async ValueTask DisposeAsync()
    {
        _channel.Writer.TryComplete();
        _cts?.Cancel();
        if (_loop is not null) await _loop;
        _cts?.Dispose();
    }
}
