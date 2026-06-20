using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;

namespace Uno.Server.Contracts;

public static class DtoMappers
{
    public static CardDto ToDto(Card c) => new(c.Color.ToString(), c.Type.ToString());
    public static Color ToColor(string s) => Enum.Parse<Color>(s);
    public static Card ToCard(CardDto d) => new(ToColor(d.Color), Enum.Parse<CardType>(d.Type));

    public static RuleSetDto ToDto(RuleSet r) => new(
        r.Stacking.ToString(), r.DrawToMatch, r.JumpIn, r.SevenZero,
        r.ForcedUnoPenalty, r.SameNumberMultiPlay, r.CumulativeScoring,
        r.WildDrawFourChallenge, r.TargetScore, r.UnoPenaltyCards);

    public static RuleSet ToEngine(RuleSetDto d) => new()
    {
        Stacking = Enum.Parse<StackingMode>(d.Stacking),
        DrawToMatch = d.DrawToMatch,
        JumpIn = d.JumpIn,
        SevenZero = d.SevenZero,
        ForcedUnoPenalty = d.ForcedUnoPenalty,
        SameNumberMultiPlay = d.SameNumberMultiPlay,
        CumulativeScoring = d.CumulativeScoring,
        WildDrawFourChallenge = d.WildDrawFourChallenge,
        TargetScore = d.TargetScore,
        UnoPenaltyCards = d.UnoPenaltyCards
    };

    public static CommandDto ToDto(Command c) => c switch
    {
        PlayCard p => new PlayCardDto(p.PlayerId, p.HandIndexes.ToArray()),
        DrawCard d => new DrawCardDto(d.PlayerId),
        ChooseColor cc => new ChooseColorDto(cc.PlayerId, cc.Color.ToString()),
        CallUno u => new CallUnoDto(u.PlayerId),
        CatchUno cu => new CatchUnoDto(cu.PlayerId, cu.TargetId),
        ChooseSevenSwapTarget st => new ChooseSevenSwapTargetDto(st.PlayerId, st.TargetId),
        Challenge ch => new ChallengeDto(ch.PlayerId),
        _ => throw new ArgumentOutOfRangeException(nameof(c))
    };

    public static Command ToEngine(CommandDto d) => d switch
    {
        PlayCardDto p => new PlayCard(p.PlayerId, p.HandIndexes),
        DrawCardDto dr => new DrawCard(dr.PlayerId),
        ChooseColorDto cc => new ChooseColor(cc.PlayerId, ToColor(cc.Color)),
        CallUnoDto u => new CallUno(u.PlayerId),
        CatchUnoDto cu => new CatchUno(cu.PlayerId, cu.TargetId),
        ChooseSevenSwapTargetDto st => new ChooseSevenSwapTarget(st.PlayerId, st.TargetId),
        ChallengeDto ch => new Challenge(ch.PlayerId),
        _ => throw new ArgumentOutOfRangeException(nameof(d))
    };

    public static GameEventDto ToDto(GameEvent e) => e switch
    {
        CardPlayed cp => new CardPlayedDto(cp.PlayerId, cp.Cards.Select(ToDto).ToArray()),
        CardsDrawn cd => new CardsDrawnDto(cd.PlayerId, cd.Count),
        TurnPassed tp => new TurnPassedDto(tp.NextPlayerIndex),
        DirectionReversed dr => new DirectionReversedDto(dr.Direction),
        ColorChosen cc => new ColorChosenDto(cc.Color.ToString()),
        UnoCalled uc => new UnoCalledDto(uc.PlayerId),
        PenaltyApplied pa => new PenaltyAppliedDto(pa.PlayerId, pa.Cards, pa.Reason),
        HandsSwapped hs => new HandsSwappedDto(hs.A, hs.B),
        HandsRotated hr => new HandsRotatedDto(hr.Direction),
        RoundEnded re => new RoundEndedDto(re.WinnerId, new Dictionary<string, int>(re.Scores)),
        GameEnded ge => new GameEndedDto(ge.WinnerId),
        CommandRejected cr => new CommandRejectedDto(cr.PlayerId, cr.Reason),
        _ => throw new ArgumentOutOfRangeException(nameof(e))
    };
}
