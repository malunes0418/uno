using Uno.Engine.Cards;

namespace Uno.Engine.Commands;

public abstract record Command(string PlayerId);

public record PlayCard(string PlayerId, IReadOnlyList<int> HandIndexes) : Command(PlayerId);
public record DrawCard(string PlayerId) : Command(PlayerId);
public record ChooseColor(string PlayerId, Color Color) : Command(PlayerId);
public record CallUno(string PlayerId) : Command(PlayerId);
public record CatchUno(string PlayerId, string TargetId) : Command(PlayerId);
public record ChooseSevenSwapTarget(string PlayerId, string TargetId) : Command(PlayerId);
public record Challenge(string PlayerId) : Command(PlayerId);
