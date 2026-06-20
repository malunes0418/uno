using System.Collections.Immutable;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.Internal;
using Uno.Engine.State;

namespace Uno.Engine;

public static class Engine
{
    public static EngineResult Apply(GameState state, Command command)
    {
        var isOutOfTurnAllowed = command is CatchUno or Challenge
            || (command is PlayCard && state.Rules.JumpIn);

        if (!isOutOfTurnAllowed && state.CurrentPlayer.Id != command.PlayerId)
            return Reject(state, command.PlayerId, "Not your turn.");

        return command switch
        {
            DrawCard d => HandleDraw(state, d),
            PlayCard p => HandlePlay(state, p),
            CallUno c => HandleCallUno(state, c),
            ChooseColor cc => HandleChooseColor(state, cc),
            CatchUno cu => HandleCatchUno(state, cu),
            ChooseSevenSwapTarget st => HandleSevenTarget(state, st),
            Challenge ch => HandleChallenge(state, ch),
            _ => Reject(state, command.PlayerId, "Command not supported yet.")
        };
    }

    internal static EngineResult Reject(GameState state, string playerId, string reason)
        => new(state, new GameEvent[] { new CommandRejected(playerId, reason) });

    private static EngineResult HandleDraw(GameState state, DrawCard cmd)
    {
        var player = state.CurrentPlayer;
        var events = new List<GameEvent>();

        int count;
        if (state.PendingDraw > 0)
        {
            count = state.PendingDraw;
        }
        else if (state.Rules.DrawToMatch)
        {
            count = CountUntilPlayable(state);
        }
        else
        {
            count = 1;
        }

        var (pile, discard, rngState, drawn) = DrawLogic.DrawCards(state, count);
        var newHand = player.Hand.AddRange(drawn);
        var players = state.Players.SetItem(state.CurrentPlayerIndex,
            player with { Hand = newHand, HasCalledUno = false });

        events.Add(new CardsDrawn(player.Id, drawn.Count));

        var nextIndex = TurnMath.NextIndex(state.CurrentPlayerIndex, state.Direction, players.Count);
        events.Add(new TurnPassed(nextIndex));

        var newState = state with
        {
            Players = players,
            DrawPile = pile,
            DiscardPile = discard,
            RngState = rngState,
            PendingDraw = 0,
            CurrentPlayerIndex = nextIndex,
            Phase = Phase.AwaitingPlay,
            Challenge = null,
            Version = state.Version + 1
        };
        return new EngineResult(newState, events);
    }

    private static int CountUntilPlayable(GameState state)
    {
        var sim = state;
        var pile = state.DrawPile;
        var discard = state.DiscardPile;
        var rngState = state.RngState;
        var drawn = 0;
        while (true)
        {
            var (p, d, r, cards) = DrawLogic.DrawCards(
                sim with { DrawPile = pile, DiscardPile = discard, RngState = rngState }, 1);
            if (cards.Count == 0) return Math.Max(drawn, 1);
            drawn++;
            pile = p; discard = d; rngState = r;
            if (PlayValidation.IsPlayable(cards[0], state.TopCard, state.ActiveColor))
                return drawn;
        }
    }

    private static EngineResult HandleCallUno(GameState state, CallUno cmd)
    {
        var idx = state.Players.FindIndex(p => p.Id == cmd.PlayerId);
        if (idx < 0) return Reject(state, cmd.PlayerId, "Unknown player.");
        var players = state.Players.SetItem(idx, state.Players[idx] with { HasCalledUno = true });
        return new EngineResult(
            state with { Players = players, Version = state.Version + 1 },
            new GameEvent[] { new UnoCalled(cmd.PlayerId) });
    }

    private static EngineResult HandlePlay(GameState state, PlayCard cmd)
    {
        if (state.CurrentPlayer.Id != cmd.PlayerId)
        {
            if (!state.Rules.JumpIn || state.Phase != Phase.AwaitingPlay || state.PendingDraw > 0)
                return Reject(state, cmd.PlayerId, "Cannot play out of turn.");

            var jumperIndex = state.Players.FindIndex(p => p.Id == cmd.PlayerId);
            if (jumperIndex < 0) return Reject(state, cmd.PlayerId, "Unknown player.");

            var jumper = state.Players[jumperIndex];
            if (cmd.HandIndexes.Count != 1)
                return Reject(state, cmd.PlayerId, "Jump-in is a single identical card.");
            var jc = cmd.HandIndexes[0];
            if (jc < 0 || jc >= jumper.Hand.Count)
                return Reject(state, cmd.PlayerId, "Invalid card.");
            if (jumper.Hand[jc] != state.TopCard)
                return Reject(state, cmd.PlayerId, "Jump-in requires an identical card.");

            state = state with { CurrentPlayerIndex = jumperIndex };
        }

        var player = state.CurrentPlayer;
        var cards = PlayLogic.ResolveSelection(player, cmd.HandIndexes, state);
        if (cards is null) return Reject(state, cmd.PlayerId, "Illegal play.");

        var lead = cards[0];

        if (cards.Count > 1 && !lead.IsNumber)
            return Reject(state, cmd.PlayerId, "Only number cards can be multi-played.");

        if (state.PendingDraw > 0 && !PlayValidation.CanStack(lead, state.TopCard, state.Rules))
            return Reject(state, cmd.PlayerId, "Must stack or draw the penalty.");

        if (lead.IsWild)
        {
            ChallengeContext? challenge = null;
            if (lead.Type == CardType.WildDrawFour && state.Rules.WildDrawFourChallenge)
                challenge = new ChallengeContext(player.Id, state.ActiveColor, player.Hand);

            var newHandW = PlayLogic.RemoveCards(player.Hand, cmd.HandIndexes);
            var playersW = state.Players.SetItem(state.CurrentPlayerIndex,
                player with { Hand = newHandW });
            var discardW = state.DiscardPile.Add(lead);
            var pendingW = state.PendingDraw + (lead.Type == CardType.WildDrawFour ? 4 : 0);

            if (newHandW.IsEmpty)
            {
                var evW = new List<GameEvent> { new CardPlayed(player.Id, new[] { lead }) };
                return EndRound(state, playersW, player.Id, discardW, Color.Wild,
                                state.Direction, pendingW, evW);
            }

            return new EngineResult(
                state with
                {
                    Players = playersW, DiscardPile = discardW, PendingDraw = pendingW,
                    ActiveColor = Color.Wild, Phase = Phase.AwaitingColorChoice,
                    PendingWildPlayerId = player.Id, Challenge = challenge,
                    Version = state.Version + 1
                },
                new GameEvent[] { new CardPlayed(player.Id, new[] { lead }) });
        }

        var newHand = PlayLogic.RemoveCards(player.Hand, cmd.HandIndexes);
        var discard = state.DiscardPile.AddRange(cards);
        var players = state.Players.SetItem(state.CurrentPlayerIndex,
            player with { Hand = newHand });

        var events = new List<GameEvent> { new CardPlayed(player.Id, cards) };

        if (state.Rules.SevenZero && lead.IsNumber && !newHand.IsEmpty)
        {
            if (lead.Type == CardType.Seven)
            {
                return new EngineResult(
                    state with
                    {
                        Players = players, DiscardPile = discard, ActiveColor = lead.Color,
                        Phase = Phase.AwaitingSevenTarget, PendingWildPlayerId = player.Id,
                        Version = state.Version + 1
                    }, events);
            }
            if (lead.Type == CardType.Zero)
            {
                var rotated = RotateHands(players, state.Direction);
                events.Add(new HandsRotated(state.Direction));
                var nextIdx = TurnMath.NextIndex(state.CurrentPlayerIndex, state.Direction, players.Count);
                events.Add(new TurnPassed(nextIdx));
                return new EngineResult(
                    state with
                    {
                        Players = rotated, DiscardPile = discard, ActiveColor = lead.Color,
                        CurrentPlayerIndex = nextIdx, Phase = Phase.AwaitingPlay,
                        Version = state.Version + 1
                    }, events);
            }
        }

        var direction = state.Direction;
        var pendingDraw = state.PendingDraw;
        var skip = false;

        switch (lead.Type)
        {
            case CardType.Reverse:
                if (players.Count == 2) { skip = true; }
                else { direction = -direction; events.Add(new DirectionReversed(direction)); }
                break;
            case CardType.Skip:
                skip = true;
                break;
            case CardType.DrawTwo:
                pendingDraw += 2;
                break;
        }

        if (newHand.IsEmpty)
            return EndRound(state, players, player.Id, discard, lead.Color,
                            direction, pendingDraw, events);

        var steps = skip ? 2 : 1;
        var nextIndex = TurnMath.NextIndex(state.CurrentPlayerIndex, direction, players.Count, steps);
        events.Add(new TurnPassed(nextIndex));

        return new EngineResult(
            state with
            {
                Players = players, DiscardPile = discard, ActiveColor = lead.Color,
                Direction = direction, PendingDraw = pendingDraw,
                CurrentPlayerIndex = nextIndex, Phase = Phase.AwaitingPlay,
                Version = state.Version + 1
            }, events);
    }

    private static EngineResult HandleChooseColor(GameState state, ChooseColor cmd)
    {
        if (state.Phase != Phase.AwaitingColorChoice || state.PendingWildPlayerId != cmd.PlayerId)
            return Reject(state, cmd.PlayerId, "Not awaiting your color choice.");
        if (cmd.Color == Color.Wild)
            return Reject(state, cmd.PlayerId, "Must pick a real color.");

        if (state.Challenge is not null)
        {
            var challengerIndex = TurnMath.NextIndex(
                state.CurrentPlayerIndex, state.Direction, state.Players.Count);
            return new EngineResult(
                state with
                {
                    ActiveColor = cmd.Color, Phase = Phase.AwaitingChallenge,
                    PendingWildPlayerId = null, CurrentPlayerIndex = challengerIndex,
                    Version = state.Version + 1
                },
                new GameEvent[] { new ColorChosen(cmd.Color) });
        }

        var events = new List<GameEvent> { new ColorChosen(cmd.Color) };
        var nextIndex = TurnMath.NextIndex(
            state.CurrentPlayerIndex, state.Direction, state.Players.Count);
        events.Add(new TurnPassed(nextIndex));

        return new EngineResult(
            state with
            {
                ActiveColor = cmd.Color, Phase = Phase.AwaitingPlay,
                PendingWildPlayerId = null, CurrentPlayerIndex = nextIndex,
                Version = state.Version + 1
            }, events);
    }

    private static EngineResult HandleCatchUno(GameState state, CatchUno cmd)
    {
        if (!state.Rules.ForcedUnoPenalty)
            return Reject(state, cmd.PlayerId, "UNO penalty rule is off.");

        var idx = state.Players.FindIndex(p => p.Id == cmd.TargetId);
        if (idx < 0) return Reject(state, cmd.PlayerId, "Unknown target.");

        var target = state.Players[idx];
        if (target.Hand.Count != 1 || target.HasCalledUno)
            return Reject(state, cmd.PlayerId, "Nothing to catch.");

        var (pile, discard, rngState, drawn) =
            DrawLogic.DrawCards(state, state.Rules.UnoPenaltyCards);
        var players = state.Players.SetItem(idx,
            target with { Hand = target.Hand.AddRange(drawn) });

        return new EngineResult(
            state with
            {
                Players = players, DrawPile = pile, DiscardPile = discard,
                RngState = rngState, Version = state.Version + 1
            },
            new GameEvent[] { new PenaltyApplied(cmd.TargetId, drawn.Count, "Failed to call UNO") });
    }

    private static EngineResult HandleSevenTarget(GameState state, ChooseSevenSwapTarget cmd)
    {
        if (state.Phase != Phase.AwaitingSevenTarget || state.PendingWildPlayerId != cmd.PlayerId)
            return Reject(state, cmd.PlayerId, "Not awaiting your swap target.");
        if (cmd.TargetId == cmd.PlayerId)
            return Reject(state, cmd.PlayerId, "Choose another player.");

        var aIdx = state.Players.FindIndex(p => p.Id == cmd.PlayerId);
        var bIdx = state.Players.FindIndex(p => p.Id == cmd.TargetId);
        if (bIdx < 0) return Reject(state, cmd.PlayerId, "Unknown target.");

        var a = state.Players[aIdx];
        var b = state.Players[bIdx];
        var players = state.Players
            .SetItem(aIdx, a with { Hand = b.Hand })
            .SetItem(bIdx, b with { Hand = a.Hand });

        var events = new List<GameEvent> { new HandsSwapped(cmd.PlayerId, cmd.TargetId) };
        var nextIdx = TurnMath.NextIndex(state.CurrentPlayerIndex, state.Direction, players.Count);
        events.Add(new TurnPassed(nextIdx));

        return new EngineResult(
            state with
            {
                Players = players, Phase = Phase.AwaitingPlay,
                PendingWildPlayerId = null, CurrentPlayerIndex = nextIdx,
                Version = state.Version + 1
            }, events);
    }

    private static EngineResult HandleChallenge(GameState state, Challenge cmd)
    {
        if (state.Phase != Phase.AwaitingChallenge || state.Challenge is null)
            return Reject(state, cmd.PlayerId, "Nothing to challenge.");
        if (state.CurrentPlayer.Id != cmd.PlayerId)
            return Reject(state, cmd.PlayerId, "Not your challenge.");

        var ctx = state.Challenge;
        var hadMatch = ctx.PlayerHandAtPlay.Any(c =>
            !c.IsWild && c.Color == ctx.PriorColor);

        var events = new List<GameEvent>();
        GameState newState;

        if (hadMatch)
        {
            var playedIdx = state.Players.FindIndex(p => p.Id == ctx.PlayedById);
            var (pile, discard, rng, drawn) = DrawLogic.DrawCards(state, state.PendingDraw);
            var players = state.Players.SetItem(playedIdx,
                state.Players[playedIdx] with { Hand = state.Players[playedIdx].Hand.AddRange(drawn) });
            events.Add(new PenaltyApplied(ctx.PlayedById, drawn.Count, "Illegal Wild Draw Four"));
            newState = state with
            {
                Players = players, DrawPile = pile, DiscardPile = discard, RngState = rng,
                PendingDraw = 0, Phase = Phase.AwaitingPlay, Challenge = null,
                Version = state.Version + 1
            };
        }
        else
        {
            var penalty = state.PendingDraw + 2;
            var (pile, discard, rng, drawn) = DrawLogic.DrawCards(state, penalty);
            var challengerIdx = state.CurrentPlayerIndex;
            var players = state.Players.SetItem(challengerIdx,
                state.CurrentPlayer with { Hand = state.CurrentPlayer.Hand.AddRange(drawn) });
            events.Add(new PenaltyApplied(cmd.PlayerId, drawn.Count, "Failed challenge"));
            var nextIdx = TurnMath.NextIndex(challengerIdx, state.Direction, players.Count);
            events.Add(new TurnPassed(nextIdx));
            newState = state with
            {
                Players = players, DrawPile = pile, DiscardPile = discard, RngState = rng,
                PendingDraw = 0, CurrentPlayerIndex = nextIdx, Phase = Phase.AwaitingPlay,
                Challenge = null, Version = state.Version + 1
            };
        }
        return new EngineResult(newState, events);
    }

    private static EngineResult EndRound(
        GameState state, ImmutableList<Player> players, string winnerId,
        ImmutableList<Card> discard, Color activeColor, int direction, int pendingDraw,
        List<GameEvent> events)
    {
        var scored = Scoring.RoundScores(
            state with { Players = players }, winnerId);

        var updatedPlayers = players
            .Select(p => p with { Score = scored[p.Id] })
            .ToImmutableList();

        var winnerScore = scored[winnerId];
        var gameOver = !state.Rules.CumulativeScoring || winnerScore >= state.Rules.TargetScore;

        events.Add(new RoundEnded(winnerId, scored));
        if (gameOver) events.Add(new GameEnded(winnerId));

        return new EngineResult(
            state with
            {
                Players = updatedPlayers, DiscardPile = discard, ActiveColor = activeColor,
                Direction = direction, PendingDraw = pendingDraw,
                Phase = gameOver ? Phase.GameOver : Phase.RoundOver,
                Version = state.Version + 1
            }, events);
    }

    private static ImmutableList<Player> RotateHands(ImmutableList<Player> players, int direction)
    {
        var hands = players.Select(p => p.Hand).ToList();
        var n = players.Count;
        var rotated = new ImmutableList<Card>[n];
        for (var i = 0; i < n; i++)
        {
            var source = TurnMath.NextIndex(i, -direction, n);
            rotated[i] = hands[source];
        }
        return players.Select((p, i) => p with { Hand = rotated[i], HasCalledUno = false })
                      .ToImmutableList();
    }
}
