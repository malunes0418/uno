namespace Uno.Server.Contracts;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(CardPlayedDto), "CardPlayed")]
[JsonDerivedType(typeof(CardsDrawnDto), "CardsDrawn")]
[JsonDerivedType(typeof(TurnPassedDto), "TurnPassed")]
[JsonDerivedType(typeof(DirectionReversedDto), "DirectionReversed")]
[JsonDerivedType(typeof(ColorChosenDto), "ColorChosen")]
[JsonDerivedType(typeof(UnoCalledDto), "UnoCalled")]
[JsonDerivedType(typeof(PenaltyAppliedDto), "PenaltyApplied")]
[JsonDerivedType(typeof(HandsSwappedDto), "HandsSwapped")]
[JsonDerivedType(typeof(HandsRotatedDto), "HandsRotated")]
[JsonDerivedType(typeof(RoundEndedDto), "RoundEnded")]
[JsonDerivedType(typeof(GameEndedDto), "GameEnded")]
[JsonDerivedType(typeof(CommandRejectedDto), "CommandRejected")]
public abstract record GameEventDto;

public record CardPlayedDto(string PlayerId, CardDto[] Cards) : GameEventDto;
public record CardsDrawnDto(string PlayerId, int Count) : GameEventDto;
public record TurnPassedDto(int NextPlayerIndex) : GameEventDto;
public record DirectionReversedDto(int Direction) : GameEventDto;
public record ColorChosenDto(string Color) : GameEventDto;
public record UnoCalledDto(string PlayerId) : GameEventDto;
public record PenaltyAppliedDto(string PlayerId, int Cards, string Reason) : GameEventDto;
public record HandsSwappedDto(string A, string B) : GameEventDto;
public record HandsRotatedDto(int Direction) : GameEventDto;
public record RoundEndedDto(string WinnerId, Dictionary<string, int> Scores) : GameEventDto;
public record GameEndedDto(string WinnerId) : GameEventDto;
public record CommandRejectedDto(string PlayerId, string Reason) : GameEventDto;
