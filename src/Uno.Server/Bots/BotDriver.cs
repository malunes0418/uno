using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Internal;
using Uno.Engine.State;

namespace Uno.Server.Bots;

public static class BotDriver
{
    public static Command ChooseCommand(GameState state, string botId)
    {
        var player = state.PlayerById(botId)!;
        var hand = player.Hand;

        if (state.Phase == Phase.AwaitingColorChoice && state.PendingWildPlayerId == botId)
            return new ChooseColor(botId, MostHeldColor(hand));

        if (state.Phase == Phase.AwaitingSevenTarget && state.PendingWildPlayerId == botId)
        {
            var target = state.Players
                .Where(p => p.Id != botId)
                .OrderByDescending(p => p.Hand.Count)
                .First().Id;
            return new ChooseSevenSwapTarget(botId, target);
        }

        if (state.Phase == Phase.AwaitingChallenge && state.CurrentPlayer.Id == botId)
            return new Challenge(botId);

        if (hand.Count == 1 && !player.HasCalledUno)
            return new CallUno(botId);

        for (var i = 0; i < hand.Count; i++)
        {
            var card = hand[i];
            if (PlayValidation.IsPlayable(card, state.TopCard, state.ActiveColor))
                return new PlayCard(botId, new[] { i });
        }

        return new DrawCard(botId);
    }

    private static Color MostHeldColor(IReadOnlyList<Card> hand)
    {
        return hand.Where(c => !c.IsWild)
            .GroupBy(c => c.Color)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .FirstOrDefault(Color.Red);
    }
}
