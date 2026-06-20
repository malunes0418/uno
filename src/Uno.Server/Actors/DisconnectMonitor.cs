using System.Collections.Concurrent;

namespace Uno.Server.Actors;

public class DisconnectMonitor
{
    private readonly ConcurrentDictionary<(string RoomCode, string PlayerId), CancellationTokenSource> _pending = new();

    public void Schedule(string roomCode, string playerId, TimeSpan delay, Func<Task> action)
    {
        Cancel(roomCode, playerId);
        var cts = new CancellationTokenSource();
        _pending[(roomCode, playerId)] = cts;
        _ = RunAfterDelayAsync(roomCode, playerId, delay, action, cts);
    }

    public void Cancel(string roomCode, string playerId)
    {
        if (_pending.TryRemove((roomCode, playerId), out var cts))
            cts.Cancel();
    }

    private async Task RunAfterDelayAsync(
        string roomCode,
        string playerId,
        TimeSpan delay,
        Func<Task> action,
        CancellationTokenSource cts)
    {
        try
        {
            await Task.Delay(delay, cts.Token);
            if (_pending.TryRemove((roomCode, playerId), out _))
                await action();
        }
        catch (OperationCanceledException)
        {
        }
        finally
        {
            cts.Dispose();
        }
    }
}
