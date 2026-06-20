using Uno.Engine.Commands;

namespace Uno.Server.Actors;

public record ActorMessage(Command Command, int LastSeenVersion, TaskCompletionSource<bool> Ack);
