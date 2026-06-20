using System.Collections.Immutable;

namespace Uno.Engine.Rng;

public sealed class DeterministicRng
{
    private uint _state;
    public int Seed { get; }
    public int State => (int)_state;

    public DeterministicRng(int seed)
    {
        Seed = seed;
        _state = unchecked((uint)seed * 2654435761u + 1u);
    }

    public int Next(int maxExclusive)
    {
        if (maxExclusive <= 0) throw new ArgumentOutOfRangeException(nameof(maxExclusive));
        _state ^= _state << 13;
        _state ^= _state >> 17;
        _state ^= _state << 5;
        return (int)(_state % (uint)maxExclusive);
    }

    public ImmutableList<T> Shuffle<T>(IReadOnlyList<T> items)
    {
        var arr = items.ToArray();
        for (var i = arr.Length - 1; i > 0; i--)
        {
            var j = Next(i + 1);
            (arr[i], arr[j]) = (arr[j], arr[i]);
        }
        return arr.ToImmutableList();
    }
}
