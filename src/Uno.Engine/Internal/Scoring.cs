using Uno.Engine.State;

namespace Uno.Engine.Internal;

public static class Scoring
{
    public static int WinnerGain(GameState state, string winnerId)
        => state.Players.Where(p => p.Id != winnerId).Sum(p => p.HandScore);

    public static IReadOnlyDictionary<string, int> RoundScores(GameState state, string winnerId)
    {
        var gain = WinnerGain(state, winnerId);
        return state.Players.ToDictionary(
            p => p.Id,
            p => p.Id == winnerId ? p.Score + gain : p.Score);
    }
}
