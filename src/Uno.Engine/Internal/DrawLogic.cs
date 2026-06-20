using System.Collections.Immutable;
using Uno.Engine.Cards;
using Uno.Engine.Rng;
using Uno.Engine.State;

namespace Uno.Engine.Internal;

public static class DrawLogic
{
    public static (ImmutableStack<Card> Pile, ImmutableList<Card> Discard, int RngState, ImmutableList<Card> Drawn)
        DrawCards(GameState state, int count)
    {
        var pile = state.DrawPile;
        var discard = state.DiscardPile;
        var rngState = state.RngState;
        var drawn = ImmutableList.CreateBuilder<Card>();

        for (var i = 0; i < count; i++)
        {
            if (pile.IsEmpty)
            {
                if (discard.Count <= 1) break;

                var top = discard[^1];
                var toShuffle = discard.RemoveAt(discard.Count - 1);

                var rng = new DeterministicRng(rngState);
                var reshuffled = rng.Shuffle(toShuffle);
                rngState = rng.State;

                pile = ImmutableStack.CreateRange(Enumerable.Reverse(reshuffled));
                discard = ImmutableList.Create(top);
            }

            if (pile.IsEmpty) break;
            pile = pile.Pop(out var card);
            drawn.Add(card);
        }

        return (pile, discard, rngState, drawn.ToImmutable());
    }
}
