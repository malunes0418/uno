using System.Collections.Immutable;
using Uno.Engine.Cards;
using Uno.Engine.State;

namespace Uno.Engine.Internal;

public static class PlayLogic
{
    public static IReadOnlyList<Card>? ResolveSelection(
        Player player, IReadOnlyList<int> indexes, GameState state)
    {
        if (indexes.Count == 0) return null;
        if (indexes.Distinct().Count() != indexes.Count) return null;
        if (indexes.Any(i => i < 0 || i >= player.Hand.Count)) return null;

        var cards = indexes.Select(i => player.Hand[i]).ToList();
        var lead = cards[0];

        if (!PlayValidation.IsPlayable(lead, state.TopCard, state.ActiveColor))
            return null;

        if (cards.Count > 1)
        {
            if (!state.Rules.SameNumberMultiPlay) return null;
            if (!lead.IsNumber) return null;
            if (cards.Any(c => c.Type != lead.Type)) return null;
        }
        return cards;
    }

    public static ImmutableList<Card> RemoveCards(ImmutableList<Card> hand, IReadOnlyList<int> indexes)
    {
        var ordered = indexes.OrderByDescending(i => i);
        var result = hand;
        foreach (var i in ordered) result = result.RemoveAt(i);
        return result;
    }
}
