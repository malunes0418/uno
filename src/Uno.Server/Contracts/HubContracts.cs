namespace Uno.Server.Contracts;

public record RuleSetDto(
    string Stacking,
    bool DrawToMatch,
    bool JumpIn,
    bool SevenZero,
    bool ForcedUnoPenalty,
    bool SameNumberMultiPlay,
    bool CumulativeScoring,
    bool WildDrawFourChallenge,
    int TargetScore = 500,
    int UnoPenaltyCards = 2);

public record RoomPlayerDto(
    string Id,
    string Name,
    bool IsBot,
    bool Connected,
    bool IsHost);

public record RoomDto(
    string Code,
    RuleSetDto Rules,
    IReadOnlyList<RoomPlayerDto> Players,
    string HostId,
    string Status);

public record CreateRoomResult(string Code, string PlayerId);
public record JoinRoomResult(string PlayerId);

public record CardDto(string Color, string Type);

public record ClientPlayerDto(
    string Id,
    string Name,
    IReadOnlyList<CardDto>? Hand,
    int HandCount,
    bool HasCalledUno,
    bool Connected,
    bool IsBot,
    int Score);

public record ClientGameStateDto(
    string RoomCode,
    string ViewerId,
    RuleSetDto Rules,
    IReadOnlyList<ClientPlayerDto> Players,
    CardDto TopCard,
    IReadOnlyList<CardDto> DiscardPile,
    string ActiveColor,
    int CurrentPlayerIndex,
    int Direction,
    int PendingDraw,
    string Phase,
    int Version,
    int DrawPileCount,
    string? PendingWildPlayerId,
    bool ChallengeActive);

public record GameEventBatchDto(int Version, IReadOnlyList<GameEventDto> Events);
