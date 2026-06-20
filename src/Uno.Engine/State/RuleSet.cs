namespace Uno.Engine.State;

public enum StackingMode { None, SameType, TwoAndFourInterchangeable }

public record RuleSet
{
    public StackingMode Stacking { get; init; } = StackingMode.None;
    public bool DrawToMatch { get; init; }
    public bool JumpIn { get; init; }
    public bool SevenZero { get; init; }
    public bool ForcedUnoPenalty { get; init; }
    public bool SameNumberMultiPlay { get; init; }
    public bool CumulativeScoring { get; init; }
    public bool WildDrawFourChallenge { get; init; }
    public int TargetScore { get; init; } = 500;
    public int UnoPenaltyCards { get; init; } = 2;

    public static RuleSet Classic => new();
}
