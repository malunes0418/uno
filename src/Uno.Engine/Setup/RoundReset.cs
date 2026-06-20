using System.Collections.Immutable;
using Uno.Engine.State;

namespace Uno.Engine.Setup;

public static class RoundReset
{
    public static GameState StartNextRound(GameState finished, int seed)
    {
        var seats = finished.Players
            .Select(p => (p.Id, p.Name, p.IsBot))
            .ToList();

        var fresh = GameSetup.NewGame(seats, finished.Rules, seed);

        var players = fresh.Players
            .Select(p => p with { Score = finished.PlayerById(p.Id)!.Score })
            .ToImmutableList();

        return fresh with { Players = players, Version = finished.Version + 1 };
    }
}
