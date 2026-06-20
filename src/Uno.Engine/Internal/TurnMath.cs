namespace Uno.Engine.Internal;

public static class TurnMath
{
    public static int NextIndex(int current, int direction, int playerCount, int steps = 1)
    {
        var raw = current + direction * steps;
        var mod = raw % playerCount;
        return mod < 0 ? mod + playerCount : mod;
    }
}
