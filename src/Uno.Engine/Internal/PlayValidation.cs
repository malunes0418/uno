using Uno.Engine.Cards;
using Uno.Engine.State;

namespace Uno.Engine.Internal;

public static class PlayValidation
{
    public static bool IsPlayable(Card card, Card top, Color activeColor)
    {
        if (card.IsWild) return true;
        if (card.Color == activeColor) return true;
        return card.Type == top.Type;
    }

    public static bool CanStack(Card card, Card top, RuleSet rules)
    {
        if (rules.Stacking == StackingMode.None) return false;

        var topIsDrawCard = top.Type is CardType.DrawTwo or CardType.WildDrawFour;
        if (!topIsDrawCard) return false;

        return rules.Stacking switch
        {
            StackingMode.SameType => card.Type == top.Type,
            StackingMode.TwoAndFourInterchangeable =>
                card.Type is CardType.DrawTwo or CardType.WildDrawFour,
            _ => false
        };
    }
}
