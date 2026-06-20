using System.Collections.Immutable;
using Uno.Engine.Cards;

namespace Uno.Engine.State;

public record ChallengeContext(string PlayedById, Color PriorColor, ImmutableList<Card> PlayerHandAtPlay);
