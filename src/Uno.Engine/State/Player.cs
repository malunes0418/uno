using System.Collections.Immutable;
using Uno.Engine.Cards;

namespace Uno.Engine.State;

public record Player(
    string Id,
    string Name,
    ImmutableList<Card> Hand,
    bool HasCalledUno,
    bool Connected,
    bool IsBot,
    int Score)
{
    public int HandScore => Hand.Sum(c => c.ScoreValue);
}
