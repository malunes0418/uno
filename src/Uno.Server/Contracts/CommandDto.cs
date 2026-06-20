namespace Uno.Server.Contracts;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(PlayCardDto), "PlayCard")]
[JsonDerivedType(typeof(DrawCardDto), "DrawCard")]
[JsonDerivedType(typeof(ChooseColorDto), "ChooseColor")]
[JsonDerivedType(typeof(CallUnoDto), "CallUno")]
[JsonDerivedType(typeof(CatchUnoDto), "CatchUno")]
[JsonDerivedType(typeof(ChooseSevenSwapTargetDto), "ChooseSevenSwapTarget")]
[JsonDerivedType(typeof(ChallengeDto), "Challenge")]
public abstract record CommandDto(string PlayerId);

public record PlayCardDto(string PlayerId, int[] HandIndexes) : CommandDto(PlayerId);
public record DrawCardDto(string PlayerId) : CommandDto(PlayerId);
public record ChooseColorDto(string PlayerId, string Color) : CommandDto(PlayerId);
public record CallUnoDto(string PlayerId) : CommandDto(PlayerId);
public record CatchUnoDto(string PlayerId, string TargetId) : CommandDto(PlayerId);
public record ChooseSevenSwapTargetDto(string PlayerId, string TargetId) : CommandDto(PlayerId);
public record ChallengeDto(string PlayerId) : CommandDto(PlayerId);
