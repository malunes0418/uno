using Uno.Engine.Events;
using Uno.Engine.State;

namespace Uno.Engine;

public record EngineResult(GameState State, IReadOnlyList<GameEvent> Events);
