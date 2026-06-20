using System.Collections.Immutable;

namespace Uno.Engine.Cards;

public static class DeckFactory
{
    private static readonly Color[] Colors =
        { Color.Red, Color.Yellow, Color.Green, Color.Blue };

    public static ImmutableList<Card> CreateStandardDeck()
    {
        var b = ImmutableList.CreateBuilder<Card>();

        foreach (var color in Colors)
        {
            b.Add(new Card(color, CardType.Zero));

            for (var t = CardType.One; t <= CardType.Nine; t++)
            {
                b.Add(new Card(color, t));
                b.Add(new Card(color, t));
            }

            foreach (var t in new[] { CardType.Skip, CardType.Reverse, CardType.DrawTwo })
            {
                b.Add(new Card(color, t));
                b.Add(new Card(color, t));
            }
        }

        for (var i = 0; i < 4; i++)
        {
            b.Add(new Card(Color.Wild, CardType.Wild));
            b.Add(new Card(Color.Wild, CardType.WildDrawFour));
        }

        return b.ToImmutable();
    }
}
