namespace Uno.Server.Options;

public class GameOptions
{
    public const string SectionName = "Game";

    public int DisconnectTimeoutSeconds { get; set; } = 30;
    public int BotMinDelayMs { get; set; } = 500;
    public int BotMaxDelayMs { get; set; } = 1500;
}
