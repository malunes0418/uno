# UNO Engine (Uno.Engine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure, immutable, fully unit-tested C# rules engine for UNO Classic with all house rules toggleable, with zero dependencies on ASP.NET, SignalR, or EF.

**Architecture:** A standalone .NET class library exposing one core pure function `Engine.Apply(GameState, Command) → EngineResult(GameState, IReadOnlyList<GameEvent>)`. All state is immutable records; every command produces a new state plus an ordered list of events that downstream layers animate against. Determinism is guaranteed by a seeded RNG so any game replays exactly from `RngSeed` + command log.

**Tech Stack:** .NET 10, C# 14, xUnit, FluentAssertions. No other dependencies.

## Global Constraints

- Target framework: `net10.0`. Nullable reference types: enabled. Implicit usings: enabled.
- `Uno.Engine` MUST NOT reference ASP.NET Core, SignalR, EF Core, or any I/O library. Pure logic only.
- All domain types are immutable: use `record` / `record struct` and `System.Collections.Immutable` collections. No public setters.
- No exceptions for invalid player moves — return a `CommandRejected` event and the unchanged state. Exceptions are reserved for genuine programmer errors (e.g. malformed engine input).
- Engine is deterministic: given a `RngSeed` and a command sequence, the resulting state is identical every run. All randomness flows through the seeded RNG carried in state.
- Deck composition (108 cards): per color (Red/Yellow/Green/Blue) one `0`, two each of `1–9`, two each of `Skip`/`Reverse`/`DrawTwo`; plus four `Wild` and four `WildDrawFour`.
- Scoring: number cards = face value; `Skip`/`Reverse`/`DrawTwo` = 20; `Wild`/`WildDrawFour` = 50.
- Test naming: `MethodOrBehavior_Scenario_ExpectedResult`. One behavior per test.

---

## File Structure

```
uno/
  Uno.sln
  src/Uno.Engine/
    Uno.Engine.csproj
    Cards/Color.cs              # Color enum
    Cards/CardType.cs           # CardType enum
    Cards/Card.cs               # Card record + helpers (IsWild, IsAction, ScoreValue)
    Cards/DeckFactory.cs        # Builds the canonical 108-card deck
    State/Player.cs             # Player record
    State/Phase.cs              # Phase enum
    State/RuleSet.cs            # RuleSet record + StackingMode enum + defaults
    State/GameState.cs          # GameState record + projections helpers
    Rng/DeterministicRng.cs     # Seeded RNG + Shuffle
    Commands/Command.cs         # Command base + concrete commands
    Events/GameEvent.cs         # GameEvent base + concrete events
    Engine.cs                   # Apply(state, command) dispatch
    Setup/GameSetup.cs          # NewGame / deal / initial flip / round reset
    Internal/TurnMath.cs        # next-player / direction helpers
    Internal/PlayValidation.cs  # legality checks
  tests/Uno.Engine.Tests/
    Uno.Engine.Tests.csproj
    (mirrors src with *Tests.cs files)
```

Each file has one responsibility. `Engine.cs` dispatches to internal handlers but holds no state.

---
## Task 1: Solution scaffolding + Card model

**Files:**
- Create: `Uno.sln`, `src/Uno.Engine/Uno.Engine.csproj`, `tests/Uno.Engine.Tests/Uno.Engine.Tests.csproj`
- Create: `src/Uno.Engine/Cards/Color.cs`, `src/Uno.Engine/Cards/CardType.cs`, `src/Uno.Engine/Cards/Card.cs`
- Test: `tests/Uno.Engine.Tests/Cards/CardTests.cs`

**Interfaces:**
- Produces: `enum Color { Red, Yellow, Green, Blue, Wild }`; `enum CardType { Zero..Nine, Skip, Reverse, DrawTwo, Wild, WildDrawFour }`; `record Card(Color Color, CardType Type)` with computed members `bool IsWild`, `bool IsAction`, `bool IsNumber`, `int ScoreValue`.

- [ ] **Step 1: Scaffold solution and projects**

```bash
cd /c/Users/cayma/Desktop/Projs/uno
dotnet new sln -n Uno
dotnet new classlib -n Uno.Engine -o src/Uno.Engine -f net10.0
dotnet new xunit -n Uno.Engine.Tests -o tests/Uno.Engine.Tests -f net10.0
dotnet sln add src/Uno.Engine/Uno.Engine.csproj tests/Uno.Engine.Tests/Uno.Engine.Tests.csproj
dotnet add tests/Uno.Engine.Tests/Uno.Engine.Tests.csproj reference src/Uno.Engine/Uno.Engine.csproj
dotnet add tests/Uno.Engine.Tests/Uno.Engine.Tests.csproj package FluentAssertions
rm src/Uno.Engine/Class1.cs tests/Uno.Engine.Tests/UnitTest1.cs
```

Edit `src/Uno.Engine/Uno.Engine.csproj` to ensure `<Nullable>enable</Nullable>` and `<ImplicitUsings>enable</ImplicitUsings>` are set inside `<PropertyGroup>`.

- [ ] **Step 2: Write the failing test**

```csharp
// tests/Uno.Engine.Tests/Cards/CardTests.cs
using FluentAssertions;
using Uno.Engine.Cards;
using Xunit;

namespace Uno.Engine.Tests.Cards;

public class CardTests
{
    [Fact]
    public void ScoreValue_NumberCard_IsFaceValue()
    {
        new Card(Color.Red, CardType.Seven).ScoreValue.Should().Be(7);
        new Card(Color.Blue, CardType.Zero).ScoreValue.Should().Be(0);
    }

    [Fact]
    public void ScoreValue_ActionCard_Is20()
    {
        new Card(Color.Green, CardType.Skip).ScoreValue.Should().Be(20);
        new Card(Color.Yellow, CardType.DrawTwo).ScoreValue.Should().Be(20);
    }

    [Fact]
    public void ScoreValue_WildCard_Is50()
    {
        new Card(Color.Wild, CardType.Wild).ScoreValue.Should().Be(50);
        new Card(Color.Wild, CardType.WildDrawFour).ScoreValue.Should().Be(50);
    }

    [Fact]
    public void Classification_Flags_AreCorrect()
    {
        new Card(Color.Red, CardType.Five).IsNumber.Should().BeTrue();
        new Card(Color.Red, CardType.Skip).IsAction.Should().BeTrue();
        new Card(Color.Wild, CardType.WildDrawFour).IsWild.Should().BeTrue();
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `dotnet test tests/Uno.Engine.Tests`
Expected: FAIL — `Card` / `Color` / `CardType` do not exist (compile error).

- [ ] **Step 4: Write the enums and Card record**

```csharp
// src/Uno.Engine/Cards/Color.cs
namespace Uno.Engine.Cards;
public enum Color { Red, Yellow, Green, Blue, Wild }
```

```csharp
// src/Uno.Engine/Cards/CardType.cs
namespace Uno.Engine.Cards;
public enum CardType
{
    Zero, One, Two, Three, Four, Five, Six, Seven, Eight, Nine,
    Skip, Reverse, DrawTwo, Wild, WildDrawFour
}
```

```csharp
// src/Uno.Engine/Cards/Card.cs
namespace Uno.Engine.Cards;

public record Card(Color Color, CardType Type)
{
    public bool IsWild => Type is CardType.Wild or CardType.WildDrawFour;
    public bool IsAction => Type is CardType.Skip or CardType.Reverse or CardType.DrawTwo;
    public bool IsNumber => Type <= CardType.Nine;

    public int ScoreValue => Type switch
    {
        CardType.Wild or CardType.WildDrawFour => 50,
        CardType.Skip or CardType.Reverse or CardType.DrawTwo => 20,
        _ => (int)Type // Zero..Nine map to 0..9
    };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `dotnet test tests/Uno.Engine.Tests`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git init   # if not already a repo
git add -A
git commit -m "feat(engine): solution scaffolding and Card model"
```

---

## Task 2: DeckFactory (108-card canonical deck)

**Files:**
- Create: `src/Uno.Engine/Cards/DeckFactory.cs`
- Test: `tests/Uno.Engine.Tests/Cards/DeckFactoryTests.cs`

**Interfaces:**
- Consumes: `Card`, `Color`, `CardType`.
- Produces: `static class DeckFactory { static ImmutableList<Card> CreateStandardDeck(); }`.

- [ ] **Step 1: Write the failing test**

```csharp
// tests/Uno.Engine.Tests/Cards/DeckFactoryTests.cs
using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Xunit;

namespace Uno.Engine.Tests.Cards;

public class DeckFactoryTests
{
    private static ImmutableList<Card> Deck => DeckFactory.CreateStandardDeck();

    [Fact]
    public void CreateStandardDeck_HasExactly108Cards()
        => Deck.Count.Should().Be(108);

    [Fact]
    public void CreateStandardDeck_HasOneZeroPerColor()
    {
        foreach (var c in new[] { Color.Red, Color.Yellow, Color.Green, Color.Blue })
            Deck.Count(x => x.Color == c && x.Type == CardType.Zero).Should().Be(1);
    }

    [Fact]
    public void CreateStandardDeck_HasTwoOfEachOneToNinePerColor()
    {
        foreach (var c in new[] { Color.Red, Color.Yellow, Color.Green, Color.Blue })
            for (var t = CardType.One; t <= CardType.Nine; t++)
                Deck.Count(x => x.Color == c && x.Type == t).Should().Be(2);
    }

    [Fact]
    public void CreateStandardDeck_HasTwoOfEachActionPerColor()
    {
        foreach (var c in new[] { Color.Red, Color.Yellow, Color.Green, Color.Blue })
            foreach (var t in new[] { CardType.Skip, CardType.Reverse, CardType.DrawTwo })
                Deck.Count(x => x.Color == c && x.Type == t).Should().Be(2);
    }

    [Fact]
    public void CreateStandardDeck_HasFourWildAndFourWildDrawFour()
    {
        Deck.Count(x => x.Type == CardType.Wild).Should().Be(4);
        Deck.Count(x => x.Type == CardType.WildDrawFour).Should().Be(4);
        Deck.Where(x => x.IsWild).Should().OnlyContain(x => x.Color == Color.Wild);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Uno.Engine.Tests --filter DeckFactoryTests`
Expected: FAIL — `DeckFactory` does not exist.

- [ ] **Step 3: Implement DeckFactory**

```csharp
// src/Uno.Engine/Cards/DeckFactory.cs
using System.Collections.Immutable;

namespace Uno.Engine.Cards;

public static class DeckFactory
{
    private static readonly Color[] Colors =
        { Color.Red, Color.Yellow, Color.Green, Color.Blue };

    public static ImmutableList<Card> CreateStandardDeck()
    {
        var b = ImmutableList.CreateBuilder<Card>();

        foreach (var color in Colors)
        {
            b.Add(new Card(color, CardType.Zero)); // one 0

            for (var t = CardType.One; t <= CardType.Nine; t++) // two each 1..9
            {
                b.Add(new Card(color, t));
                b.Add(new Card(color, t));
            }

            foreach (var t in new[] { CardType.Skip, CardType.Reverse, CardType.DrawTwo })
            {
                b.Add(new Card(color, t)); // two each action
                b.Add(new Card(color, t));
            }
        }

        for (var i = 0; i < 4; i++)
        {
            b.Add(new Card(Color.Wild, CardType.Wild));
            b.Add(new Card(Color.Wild, CardType.WildDrawFour));
        }

        return b.ToImmutable();
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Uno.Engine.Tests --filter DeckFactoryTests`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): canonical 108-card deck factory"
```

---

## Task 3: DeterministicRng (seeded shuffle)

**Files:**
- Create: `src/Uno.Engine/Rng/DeterministicRng.cs`
- Test: `tests/Uno.Engine.Tests/Rng/DeterministicRngTests.cs`

**Interfaces:**
- Produces: `sealed class DeterministicRng(int seed)` with `int Next(int maxExclusive)`, `ImmutableList<T> Shuffle<T>(IReadOnlyList<T> items)`, and `int State { get; }` (current internal counter, so it can be persisted into `GameState` and resumed).

- [ ] **Step 1: Write the failing test**

```csharp
// tests/Uno.Engine.Tests/Rng/DeterministicRngTests.cs
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Rng;
using Xunit;

namespace Uno.Engine.Tests.Rng;

public class DeterministicRngTests
{
    [Fact]
    public void Shuffle_SameSeed_ProducesSameOrder()
    {
        var deck = DeckFactory.CreateStandardDeck();
        var a = new DeterministicRng(42).Shuffle(deck);
        var b = new DeterministicRng(42).Shuffle(deck);
        a.Should().Equal(b);
    }

    [Fact]
    public void Shuffle_DifferentSeed_ProducesDifferentOrder()
    {
        var deck = DeckFactory.CreateStandardDeck();
        var a = new DeterministicRng(1).Shuffle(deck);
        var b = new DeterministicRng(2).Shuffle(deck);
        a.Should().NotEqual(b);
    }

    [Fact]
    public void Shuffle_IsPermutation_PreservesAllCards()
    {
        var deck = DeckFactory.CreateStandardDeck();
        var shuffled = new DeterministicRng(7).Shuffle(deck);
        shuffled.Should().BeEquivalentTo(deck); // same multiset, order-independent
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Uno.Engine.Tests --filter DeterministicRngTests`
Expected: FAIL — `DeterministicRng` does not exist.

- [ ] **Step 3: Implement DeterministicRng**

```csharp
// src/Uno.Engine/Rng/DeterministicRng.cs
using System.Collections.Immutable;

namespace Uno.Engine.Rng;

// Deterministic LCG-backed RNG. Same seed => same sequence, independent of platform.
public sealed class DeterministicRng
{
    private uint _state;
    public int Seed { get; }
    public int State => (int)_state;

    public DeterministicRng(int seed)
    {
        Seed = seed;
        _state = unchecked((uint)seed * 2654435761u + 1u);
    }

    public int Next(int maxExclusive)
    {
        if (maxExclusive <= 0) throw new ArgumentOutOfRangeException(nameof(maxExclusive));
        // xorshift32 for good bit mixing, then modulo.
        _state ^= _state << 13;
        _state ^= _state >> 17;
        _state ^= _state << 5;
        return (int)(_state % (uint)maxExclusive);
    }

    public ImmutableList<T> Shuffle<T>(IReadOnlyList<T> items)
    {
        var arr = items.ToArray();
        for (var i = arr.Length - 1; i > 0; i--) // Fisher-Yates
        {
            var j = Next(i + 1);
            (arr[i], arr[j]) = (arr[j], arr[i]);
        }
        return arr.ToImmutableList();
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Uno.Engine.Tests --filter DeterministicRngTests`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): deterministic seeded RNG and shuffle"
```

---

## Task 4: RuleSet, Phase, Player

**Files:**
- Create: `src/Uno.Engine/State/Phase.cs`, `src/Uno.Engine/State/RuleSet.cs`, `src/Uno.Engine/State/Player.cs`
- Test: `tests/Uno.Engine.Tests/State/RuleSetTests.cs`

**Interfaces:**
- Produces:
  - `enum Phase { AwaitingPlay, AwaitingColorChoice, AwaitingSevenTarget, AwaitingChallenge, RoundOver, GameOver }`
  - `enum StackingMode { None, SameType, TwoAndFourInterchangeable }`
  - `record RuleSet { StackingMode Stacking; bool DrawToMatch; bool JumpIn; bool SevenZero; bool ForcedUnoPenalty; bool SameNumberMultiPlay; bool CumulativeScoring; bool WildDrawFourChallenge; int TargetScore; int UnoPenaltyCards; static RuleSet Classic; }`
  - `record Player(string Id, string Name, ImmutableList<Card> Hand, bool HasCalledUno, bool Connected, bool IsBot, int Score)`

- [ ] **Step 1: Write the failing test**

```csharp
// tests/Uno.Engine.Tests/State/RuleSetTests.cs
using FluentAssertions;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests.State;

public class RuleSetTests
{
    [Fact]
    public void Classic_DefaultsToOfficialRules_AllHouseRulesOff()
    {
        var r = RuleSet.Classic;
        r.Stacking.Should().Be(StackingMode.None);
        r.DrawToMatch.Should().BeFalse();
        r.JumpIn.Should().BeFalse();
        r.SevenZero.Should().BeFalse();
        r.ForcedUnoPenalty.Should().BeFalse();
        r.SameNumberMultiPlay.Should().BeFalse();
        r.CumulativeScoring.Should().BeFalse();
        r.WildDrawFourChallenge.Should().BeFalse();
        r.TargetScore.Should().Be(500);
        r.UnoPenaltyCards.Should().Be(2);
    }

    [Fact]
    public void RuleSet_IsImmutableViaWith()
    {
        var r = RuleSet.Classic with { JumpIn = true, Stacking = StackingMode.SameType };
        r.JumpIn.Should().BeTrue();
        RuleSet.Classic.JumpIn.Should().BeFalse(); // original untouched
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Uno.Engine.Tests --filter RuleSetTests`
Expected: FAIL — types do not exist.

- [ ] **Step 3: Implement the three files**

```csharp
// src/Uno.Engine/State/Phase.cs
namespace Uno.Engine.State;
public enum Phase
{
    AwaitingPlay, AwaitingColorChoice, AwaitingSevenTarget,
    AwaitingChallenge, RoundOver, GameOver
}
```

```csharp
// src/Uno.Engine/State/RuleSet.cs
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
```

```csharp
// src/Uno.Engine/State/Player.cs
using System.Collections.Immutable;
using Uno.Engine.Cards;

namespace Uno.Engine.State;

public record Player(
    string Id,
    string Name,
    ImmutableList<Card> Hand,
    bool HasCalledUno,
    bool Connected,
    bool IsBot,
    int Score)
{
    public int HandScore => Hand.Sum(c => c.ScoreValue);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Uno.Engine.Tests --filter RuleSetTests`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): RuleSet, Phase, and Player models"
```

---

## Task 5: GameState, Commands, Events

**Files:**
- Create: `src/Uno.Engine/State/GameState.cs`, `src/Uno.Engine/Commands/Command.cs`, `src/Uno.Engine/Events/GameEvent.cs`
- Test: `tests/Uno.Engine.Tests/State/GameStateTests.cs`

**Interfaces:**
- Produces:
  - `record GameState { RuleSet Rules; ImmutableList<Player> Players; ImmutableStack<Card> DrawPile; ImmutableList<Card> DiscardPile; Color ActiveColor; int CurrentPlayerIndex; int Direction; int PendingDraw; Phase Phase; int Version; int RngSeed; int RngState; }` with helper `Card TopCard => DiscardPile[^1]` and `Player CurrentPlayer => Players[CurrentPlayerIndex]`.
  - `abstract record Command(string PlayerId)` and concrete: `PlayCard(string PlayerId, IReadOnlyList<int> HandIndexes)`, `DrawCard(string PlayerId)`, `ChooseColor(string PlayerId, Color Color)`, `CallUno(string PlayerId)`, `CatchUno(string PlayerId, string TargetId)`, `ChooseSevenSwapTarget(string PlayerId, string TargetId)`, `Challenge(string PlayerId)`.
  - `abstract record GameEvent` and concrete: `CardPlayed(string PlayerId, IReadOnlyList<Card> Cards)`, `CardsDrawn(string PlayerId, int Count)`, `TurnPassed(int NextPlayerIndex)`, `DirectionReversed(int Direction)`, `ColorChosen(Color Color)`, `UnoCalled(string PlayerId)`, `PenaltyApplied(string PlayerId, int Cards, string Reason)`, `HandsSwapped(string A, string B)`, `HandsRotated(int Direction)`, `RoundEnded(string WinnerId, IReadOnlyDictionary<string,int> Scores)`, `GameEnded(string WinnerId)`, `CommandRejected(string PlayerId, string Reason)`.

- [ ] **Step 1: Write the failing test**

```csharp
// tests/Uno.Engine.Tests/State/GameStateTests.cs
using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests.State;

public class GameStateTests
{
    [Fact]
    public void TopCard_ReturnsLastDiscard()
    {
        var state = new GameState
        {
            Rules = RuleSet.Classic,
            Players = ImmutableList<Player>.Empty,
            DrawPile = ImmutableStack<Card>.Empty,
            DiscardPile = ImmutableList.Create(
                new Card(Color.Red, CardType.One),
                new Card(Color.Blue, CardType.Five)),
            ActiveColor = Color.Blue,
            CurrentPlayerIndex = 0,
            Direction = 1,
            PendingDraw = 0,
            Phase = Phase.AwaitingPlay,
            Version = 0,
            RngSeed = 1,
            RngState = 1
        };
        state.TopCard.Should().Be(new Card(Color.Blue, CardType.Five));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Uno.Engine.Tests --filter GameStateTests`
Expected: FAIL — `GameState` does not exist.

- [ ] **Step 3: Implement GameState**

```csharp
// src/Uno.Engine/State/GameState.cs
using System.Collections.Immutable;
using Uno.Engine.Cards;

namespace Uno.Engine.State;

public record GameState
{
    public required RuleSet Rules { get; init; }
    public required ImmutableList<Player> Players { get; init; }
    public required ImmutableStack<Card> DrawPile { get; init; }
    public required ImmutableList<Card> DiscardPile { get; init; }
    public required Color ActiveColor { get; init; }
    public required int CurrentPlayerIndex { get; init; }
    public required int Direction { get; init; }
    public required int PendingDraw { get; init; }
    public required Phase Phase { get; init; }
    public required int Version { get; init; }
    public required int RngSeed { get; init; }
    public required int RngState { get; init; }

    public Card TopCard => DiscardPile[^1];
    public Player CurrentPlayer => Players[CurrentPlayerIndex];
    public Player? PlayerById(string id) => Players.FirstOrDefault(p => p.Id == id);
}
```

- [ ] **Step 4: Implement Command**

```csharp
// src/Uno.Engine/Commands/Command.cs
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
```

- [ ] **Step 5: Implement GameEvent**

```csharp
// src/Uno.Engine/Events/GameEvent.cs
using Uno.Engine.Cards;

namespace Uno.Engine.Events;

public abstract record GameEvent;

public record CardPlayed(string PlayerId, IReadOnlyList<Card> Cards) : GameEvent;
public record CardsDrawn(string PlayerId, int Count) : GameEvent;
public record TurnPassed(int NextPlayerIndex) : GameEvent;
public record DirectionReversed(int Direction) : GameEvent;
public record ColorChosen(Color Color) : GameEvent;
public record UnoCalled(string PlayerId) : GameEvent;
public record PenaltyApplied(string PlayerId, int Cards, string Reason) : GameEvent;
public record HandsSwapped(string A, string B) : GameEvent;
public record HandsRotated(int Direction) : GameEvent;
public record RoundEnded(string WinnerId, IReadOnlyDictionary<string, int> Scores) : GameEvent;
public record GameEnded(string WinnerId) : GameEvent;
public record CommandRejected(string PlayerId, string Reason) : GameEvent;
```

- [ ] **Step 6: Run test to verify it passes**

Run: `dotnet test tests/Uno.Engine.Tests --filter GameStateTests`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(engine): GameState, Command, and GameEvent types"
```

---

## Task 6: EngineResult + Engine.Apply dispatch skeleton

**Files:**
- Create: `src/Uno.Engine/EngineResult.cs`, `src/Uno.Engine/Engine.cs`
- Test: `tests/Uno.Engine.Tests/EngineDispatchTests.cs`

**Interfaces:**
- Produces: `record EngineResult(GameState State, IReadOnlyList<GameEvent> Events)`; `static class Engine { static EngineResult Apply(GameState state, Command command); }`. Unknown/illegal commands return the unchanged state (with `Version` unchanged) and a single `CommandRejected` event. A helper `Reject(GameState, string playerId, string reason)` centralizes rejection.

- [ ] **Step 1: Write the failing test**

```csharp
// tests/Uno.Engine.Tests/EngineDispatchTests.cs
using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class EngineDispatchTests
{
    private static GameState MinimalState() => new()
    {
        Rules = RuleSet.Classic,
        Players = ImmutableList.Create(
            new Player("p1", "P1", ImmutableList<Card>.Empty, false, true, false, 0)),
        DrawPile = ImmutableStack<Card>.Empty,
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.One)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 5, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void Apply_PlayFromNonCurrentPlayer_IsRejectedAndStateUnchanged()
    {
        var state = MinimalState();
        var result = Engine.Apply(state, new DrawCard("ghost"));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
        result.State.Version.Should().Be(5); // unchanged
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Uno.Engine.Tests --filter EngineDispatchTests`
Expected: FAIL — `Engine` / `EngineResult` do not exist.

- [ ] **Step 3: Implement EngineResult and Engine skeleton**

```csharp
// src/Uno.Engine/EngineResult.cs
using Uno.Engine.Events;
using Uno.Engine.State;

namespace Uno.Engine;

public record EngineResult(GameState State, IReadOnlyList<GameEvent> Events);
```

```csharp
// src/Uno.Engine/Engine.cs
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;

namespace Uno.Engine;

public static class Engine
{
    public static EngineResult Apply(GameState state, Command command)
    {
        // Out-of-turn guard. Exceptions: JumpIn play and CatchUno/Challenge,
        // which are validated inside their own handlers (added in later tasks).
        var isOutOfTurnAllowed = command is CatchUno or Challenge
            || (command is PlayCard && state.Rules.JumpIn);

        if (!isOutOfTurnAllowed && state.CurrentPlayer.Id != command.PlayerId)
            return Reject(state, command.PlayerId, "Not your turn.");

        return command switch
        {
            // Concrete handlers are wired up in later tasks. For now everything
            // not yet implemented is a safe rejection.
            _ => Reject(state, command.PlayerId, "Command not supported yet.")
        };
    }

    internal static EngineResult Reject(GameState state, string playerId, string reason)
        => new(state, new GameEvent[] { new CommandRejected(playerId, reason) });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Uno.Engine.Tests --filter EngineDispatchTests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): Apply dispatch skeleton with rejection path"
```

---

## Task 7: GameSetup — new game, deal, initial flip

**Files:**
- Create: `src/Uno.Engine/Internal/TurnMath.cs`, `src/Uno.Engine/Setup/GameSetup.cs`
- Test: `tests/Uno.Engine.Tests/Setup/GameSetupTests.cs`

**Interfaces:**
- Consumes: `DeckFactory`, `DeterministicRng`, `GameState`, `Player`, `RuleSet`.
- Produces:
  - `static class TurnMath { static int NextIndex(int current, int direction, int playerCount, int steps = 1); }` — wraps modulo correctly for negative directions.
  - `static class GameSetup { static GameState NewGame(IReadOnlyList<(string Id,string Name,bool IsBot)> seats, RuleSet rules, int seed); }` — deals 7 cards each, flips the first non-WildDrawFour card to start the discard, sets `ActiveColor`, applies a first-card action to the first player (Skip/Reverse/DrawTwo handled minimally: Reverse flips direction, Skip advances current player, DrawTwo sets `PendingDraw=2`). Wild as first card → `Phase = AwaitingColorChoice` with first player choosing.

- [ ] **Step 1: Write the failing tests**

```csharp
// tests/Uno.Engine.Tests/Setup/GameSetupTests.cs
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Internal;
using Uno.Engine.Setup;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests.Setup;

public class GameSetupTests
{
    private static GameState New(int seed = 1) => GameSetup.NewGame(
        new[] { ("p1","P1",false), ("p2","P2",false), ("p3","P3",true) },
        RuleSet.Classic, seed);

    [Fact]
    public void NewGame_DealsSevenCardsToEachPlayer()
        => New().Players.Should().OnlyContain(p => p.Hand.Count == 7);

    [Fact]
    public void NewGame_StartsDiscardWithOneCard()
        => New().DiscardPile.Count.Should().Be(1);

    [Fact]
    public void NewGame_TopCardIsNeverWildDrawFour()
        => New().TopCard.Type.Should().NotBe(CardType.WildDrawFour);

    [Fact]
    public void NewGame_TotalCardsConservedAcross108()
    {
        var s = New();
        var total = s.Players.Sum(p => p.Hand.Count) + s.DrawPile.Count() + s.DiscardPile.Count;
        total.Should().Be(108);
    }

    [Fact]
    public void NewGame_SameSeed_ProducesIdenticalDeal()
    {
        New(99).Should().BeEquivalentTo(New(99));
    }

    [Fact]
    public void NextIndex_WrapsForwardAndBackward()
    {
        TurnMath.NextIndex(2, 1, 3).Should().Be(0);
        TurnMath.NextIndex(0, -1, 3).Should().Be(2);
        TurnMath.NextIndex(0, 1, 3, steps: 2).Should().Be(2);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Uno.Engine.Tests --filter GameSetupTests`
Expected: FAIL — `GameSetup` / `TurnMath` do not exist.

- [ ] **Step 3: Implement TurnMath**

```csharp
// src/Uno.Engine/Internal/TurnMath.cs
namespace Uno.Engine.Internal;

public static class TurnMath
{
    public static int NextIndex(int current, int direction, int playerCount, int steps = 1)
    {
        var raw = current + direction * steps;
        var mod = raw % playerCount;
        return mod < 0 ? mod + playerCount : mod;
    }
}
```

- [ ] **Step 4: Implement GameSetup**

```csharp
// src/Uno.Engine/Setup/GameSetup.cs
using System.Collections.Immutable;
using Uno.Engine.Cards;
using Uno.Engine.Internal;
using Uno.Engine.Rng;
using Uno.Engine.State;

namespace Uno.Engine.Setup;

public static class GameSetup
{
    public static GameState NewGame(
        IReadOnlyList<(string Id, string Name, bool IsBot)> seats,
        RuleSet rules,
        int seed)
    {
        var rng = new DeterministicRng(seed);
        var shuffled = rng.Shuffle(DeckFactory.CreateStandardDeck());

        // Working list we pop from the front for clarity.
        var deck = new List<Card>(shuffled);
        var cursor = 0;

        Card Take() => deck[cursor++];

        // Deal 7 each.
        var players = seats.Select(s =>
        {
            var hand = ImmutableList.CreateBuilder<Card>();
            for (var i = 0; i < 7; i++) hand.Add(Take());
            return new Player(s.Id, s.Name, hand.ToImmutable(), false, true, s.IsBot, 0);
        }).ToImmutableList();

        // Flip first non-WildDrawFour card to start discard.
        Card first;
        do { first = Take(); } while (first.Type == CardType.WildDrawFour);

        var discard = ImmutableList.Create(first);
        var remaining = ImmutableStack.CreateRange(
            Enumerable.Reverse(deck.Skip(cursor).ToList()));

        var direction = 1;
        var currentIndex = 0;
        var pendingDraw = 0;
        var activeColor = first.IsWild ? Color.Wild : first.Color;
        var phase = Phase.AwaitingPlay;

        // First-card action effects on the opening player.
        switch (first.Type)
        {
            case CardType.Reverse:
                direction = -1;
                // With 2 players Reverse acts as Skip; handled generically below
                // only for Skip. For opening Reverse we simply flip direction.
                break;
            case CardType.Skip:
                currentIndex = TurnMath.NextIndex(currentIndex, direction, players.Count);
                break;
            case CardType.DrawTwo:
                pendingDraw = 2;
                break;
            case CardType.Wild:
                phase = Phase.AwaitingColorChoice; // opening player chooses color
                break;
        }

        return new GameState
        {
            Rules = rules,
            Players = players,
            DrawPile = remaining,
            DiscardPile = discard,
            ActiveColor = activeColor,
            CurrentPlayerIndex = currentIndex,
            Direction = direction,
            PendingDraw = pendingDraw,
            Phase = phase,
            Version = 0,
            RngSeed = seed,
            RngState = rng.State
        };
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `dotnet test tests/Uno.Engine.Tests --filter GameSetupTests`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(engine): game setup, deal, and opening-card handling"
```

---

## Task 8: PlayValidation — card legality

**Files:**
- Create: `src/Uno.Engine/Internal/PlayValidation.cs`
- Test: `tests/Uno.Engine.Tests/Internal/PlayValidationTests.cs`

**Interfaces:**
- Produces: `static class PlayValidation { static bool IsPlayable(Card card, Card top, Color activeColor); static bool CanStack(Card card, Card top, RuleSet rules); }`. `IsPlayable` is true when the card is wild, matches `activeColor`, or matches the top card's `Type`. `CanStack` governs whether a card may be added to an active `+2/+4` chain per `StackingMode`.

- [ ] **Step 1: Write the failing tests**

```csharp
// tests/Uno.Engine.Tests/Internal/PlayValidationTests.cs
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Internal;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests.Internal;

public class PlayValidationTests
{
    private static readonly Card RedFive = new(Color.Red, CardType.Five);

    [Fact]
    public void IsPlayable_MatchingColor_True()
        => PlayValidation.IsPlayable(new Card(Color.Red, CardType.Nine), RedFive, Color.Red)
            .Should().BeTrue();

    [Fact]
    public void IsPlayable_MatchingType_True()
        => PlayValidation.IsPlayable(new Card(Color.Blue, CardType.Five), RedFive, Color.Red)
            .Should().BeTrue();

    [Fact]
    public void IsPlayable_Wild_AlwaysTrue()
        => PlayValidation.IsPlayable(new Card(Color.Wild, CardType.Wild), RedFive, Color.Red)
            .Should().BeTrue();

    [Fact]
    public void IsPlayable_NoMatch_False()
        => PlayValidation.IsPlayable(new Card(Color.Blue, CardType.Nine), RedFive, Color.Red)
            .Should().BeFalse();

    [Fact]
    public void IsPlayable_RespectsActiveColorAfterWild()
        => PlayValidation.IsPlayable(new Card(Color.Green, CardType.One),
            new Card(Color.Wild, CardType.Wild), Color.Green).Should().BeTrue();

    [Fact]
    public void CanStack_SameType_DrawTwoOnDrawTwo_True()
    {
        var rules = RuleSet.Classic with { Stacking = StackingMode.SameType };
        PlayValidation.CanStack(new Card(Color.Blue, CardType.DrawTwo),
            new Card(Color.Red, CardType.DrawTwo), rules).Should().BeTrue();
    }

    [Fact]
    public void CanStack_None_NeverAllows()
    {
        PlayValidation.CanStack(new Card(Color.Blue, CardType.DrawTwo),
            new Card(Color.Red, CardType.DrawTwo), RuleSet.Classic).Should().BeFalse();
    }

    [Fact]
    public void CanStack_Interchangeable_FourOnTwo_True()
    {
        var rules = RuleSet.Classic with { Stacking = StackingMode.TwoAndFourInterchangeable };
        PlayValidation.CanStack(new Card(Color.Wild, CardType.WildDrawFour),
            new Card(Color.Red, CardType.DrawTwo), rules).Should().BeTrue();
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Uno.Engine.Tests --filter PlayValidationTests`
Expected: FAIL — `PlayValidation` does not exist.

- [ ] **Step 3: Implement PlayValidation**

```csharp
// src/Uno.Engine/Internal/PlayValidation.cs
using Uno.Engine.Cards;
using Uno.Engine.State;

namespace Uno.Engine.Internal;

public static class PlayValidation
{
    public static bool IsPlayable(Card card, Card top, Color activeColor)
    {
        if (card.IsWild) return true;
        if (card.Color == activeColor) return true;
        return card.Type == top.Type;
    }

    public static bool CanStack(Card card, Card top, RuleSet rules)
    {
        if (rules.Stacking == StackingMode.None) return false;

        var topIsDrawCard = top.Type is CardType.DrawTwo or CardType.WildDrawFour;
        if (!topIsDrawCard) return false;

        return rules.Stacking switch
        {
            StackingMode.SameType => card.Type == top.Type,
            StackingMode.TwoAndFourInterchangeable =>
                card.Type is CardType.DrawTwo or CardType.WildDrawFour,
            _ => false
        };
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test tests/Uno.Engine.Tests --filter PlayValidationTests`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): play legality and stacking validation"
```

---
## Task 9: Drawing cards + draw-pile reshuffle

**Files:**
- Create: `src/Uno.Engine/Internal/DrawLogic.cs`
- Modify: `src/Uno.Engine/Engine.cs` (wire `DrawCard` handler)
- Test: `tests/Uno.Engine.Tests/DrawCardTests.cs`

**Interfaces:**
- Consumes: `GameState`, `DeterministicRng`, `TurnMath`, `PlayValidation`.
- Produces:
  - `static class DrawLogic { static (ImmutableStack<Card> Pile, ImmutableList<Card> Discard, int RngState, ImmutableList<Card> Drawn) DrawCards(GameState state, int count); }` — pops `count` cards; when the draw pile empties mid-draw, reshuffles `DiscardPile` except its top into a new draw pile using the carried RNG state, then continues. Returns the drawn cards plus the new pile/discard/rng.
  - Engine wires `DrawCard`: if `PendingDraw > 0`, the player draws that accumulated total and the turn passes (penalty resolved); otherwise normal draw. Under `DrawToMatch`, keep drawing until a playable card appears. Emits `CardsDrawn` then `TurnPassed`.

- [ ] **Step 1: Write the failing tests**

```csharp
// tests/Uno.Engine.Tests/DrawCardTests.cs
using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.Setup;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class DrawCardTests
{
    private static GameState TwoPlayerGame(int seed = 3) => GameSetup.NewGame(
        new[] { ("p1","P1",false), ("p2","P2",false) }, RuleSet.Classic, seed);

    [Fact]
    public void Draw_NormalTurn_AddsOneCardAndPassesTurn()
    {
        var state = TwoPlayerGame();
        var current = state.CurrentPlayer.Id;
        var before = state.CurrentPlayer.Hand.Count;

        var result = Engine.Apply(state, new DrawCard(current));

        result.State.PlayerById(current)!.Hand.Count.Should().Be(before + 1);
        result.State.CurrentPlayer.Id.Should().NotBe(current);
        result.Events.Should().Contain(e => e is CardsDrawn);
        result.Events.Should().Contain(e => e is TurnPassed);
        result.State.Version.Should().Be(state.Version + 1);
    }

    [Fact]
    public void Draw_WithPendingDraw_DrawsAccumulatedTotal()
    {
        var state = TwoPlayerGame() with { PendingDraw = 4 };
        var current = state.CurrentPlayer.Id;
        var before = state.CurrentPlayer.Hand.Count;

        var result = Engine.Apply(state, new DrawCard(current));

        result.State.PlayerById(current)!.Hand.Count.Should().Be(before + 4);
        result.State.PendingDraw.Should().Be(0);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Uno.Engine.Tests --filter DrawCardTests`
Expected: FAIL — `DrawCard` is still rejected by the skeleton.

- [ ] **Step 3: Implement DrawLogic**

```csharp
// src/Uno.Engine/Internal/DrawLogic.cs
using System.Collections.Immutable;
using Uno.Engine.Cards;
using Uno.Engine.Rng;
using Uno.Engine.State;

namespace Uno.Engine.Internal;

public static class DrawLogic
{
    public static (ImmutableStack<Card> Pile, ImmutableList<Card> Discard, int RngState, ImmutableList<Card> Drawn)
        DrawCards(GameState state, int count)
    {
        var pile = state.DrawPile;
        var discard = state.DiscardPile;
        var rngState = state.RngState;
        var drawn = ImmutableList.CreateBuilder<Card>();

        for (var i = 0; i < count; i++)
        {
            if (pile.IsEmpty)
            {
                if (discard.Count <= 1) break; // nothing left to reshuffle

                var top = discard[^1];
                var toShuffle = discard.RemoveAt(discard.Count - 1);

                var rng = new DeterministicRng(rngState);
                var reshuffled = rng.Shuffle(toShuffle);
                rngState = rng.State;

                pile = ImmutableStack.CreateRange(Enumerable.Reverse(reshuffled));
                discard = ImmutableList.Create(top);
            }

            if (pile.IsEmpty) break;
            pile = pile.Pop(out var card);
            drawn.Add(card);
        }

        return (pile, discard, rngState, drawn.ToImmutable());
    }
}
```

- [ ] **Step 4: Wire DrawCard into Engine.Apply**

In `src/Uno.Engine/Engine.cs`, replace the `_ => Reject(...)` arm with a switch that handles `DrawCard`, delegating to a private handler. Add these using directives at the top: `using System.Collections.Immutable;`, `using Uno.Engine.Cards;`, `using Uno.Engine.Internal;`.

```csharp
        return command switch
        {
            DrawCard d => HandleDraw(state, d),
            _ => Reject(state, command.PlayerId, "Command not supported yet.")
        };
    }

    private static EngineResult HandleDraw(GameState state, DrawCard cmd)
    {
        var player = state.CurrentPlayer;
        var events = new List<GameEvent>();

        int count;
        if (state.PendingDraw > 0)
        {
            count = state.PendingDraw;
        }
        else if (state.Rules.DrawToMatch)
        {
            count = CountUntilPlayable(state);
        }
        else
        {
            count = 1;
        }

        var (pile, discard, rngState, drawn) = DrawLogic.DrawCards(state, count);
        var newHand = player.Hand.AddRange(drawn);
        var players = state.Players.SetItem(state.CurrentPlayerIndex,
            player with { Hand = newHand, HasCalledUno = false });

        events.Add(new CardsDrawn(player.Id, drawn.Count));

        var nextIndex = TurnMath.NextIndex(state.CurrentPlayerIndex, state.Direction, players.Count);
        events.Add(new TurnPassed(nextIndex));

        var newState = state with
        {
            Players = players,
            DrawPile = pile,
            DiscardPile = discard,
            RngState = rngState,
            PendingDraw = 0,
            CurrentPlayerIndex = nextIndex,
            Phase = Phase.AwaitingPlay,
            Version = state.Version + 1
        };
        return new EngineResult(newState, events);
    }

    // Draw-to-match helper: how many cards until one is playable (min 1).
    private static int CountUntilPlayable(GameState state)
    {
        var sim = state;
        var pile = state.DrawPile;
        var discard = state.DiscardPile;
        var rngState = state.RngState;
        var drawn = 0;
        while (true)
        {
            var (p, d, r, cards) = DrawLogic.DrawCards(
                sim with { DrawPile = pile, DiscardPile = discard, RngState = rngState }, 1);
            if (cards.Count == 0) return Math.Max(drawn, 1);
            drawn++;
            pile = p; discard = d; rngState = r;
            if (PlayValidation.IsPlayable(cards[0], state.TopCard, state.ActiveColor))
                return drawn;
        }
    }
```

> Note: `CountUntilPlayable` simulates draws to decide the count, then `HandleDraw` performs the real draw of that count. Both use the same deterministic RNG progression, so the simulated and actual draws match exactly.

- [ ] **Step 5: Run tests to verify they pass**

Run: `dotnet test tests/Uno.Engine.Tests --filter DrawCardTests`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(engine): draw card, pending-draw resolution, reshuffle"
```

---

## Task 10: Playing number cards + UNO call + win detection

**Files:**
- Create: `src/Uno.Engine/Internal/PlayLogic.cs`
- Modify: `src/Uno.Engine/Engine.cs` (wire `PlayCard`, `CallUno`)
- Test: `tests/Uno.Engine.Tests/PlayNumberCardTests.cs`

**Interfaces:**
- Consumes: `PlayValidation`, `TurnMath`, `GameState`.
- Produces: Engine handles `PlayCard` for plain number cards: validates the player holds the cards at `HandIndexes`, that the first is playable, applies `SameNumberMultiPlay` (all indexes must share the same number and be individually color/number-legal as a group), moves cards to discard, sets `ActiveColor`, advances the turn, and emits `CardPlayed` + `TurnPassed`. `CallUno` sets `HasCalledUno`. When a player's hand reaches 0, emits `RoundEnded`/`GameEnded` (full scoring wired in Task 14; here emit `RoundEnded` with an empty score map as a placeholder that Task 14 replaces).

- [ ] **Step 1: Write the failing tests**

```csharp
// tests/Uno.Engine.Tests/PlayNumberCardTests.cs
using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class PlayNumberCardTests
{
    // Hand-built deterministic state: P1 to move, top is Red 5, active Red.
    private static GameState Make(ImmutableList<Card> p1Hand, RuleSet? rules = null) => new()
    {
        Rules = rules ?? RuleSet.Classic,
        Players = ImmutableList.Create(
            new Player("p1","P1", p1Hand, false, true, false, 0),
            new Player("p2","P2", ImmutableList.Create(
                new Card(Color.Green, CardType.One)), false, true, false, 0)),
        DrawPile = ImmutableStack.CreateRange(new[] { new Card(Color.Blue, CardType.Two) }),
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void PlayCard_LegalNumber_MovesToDiscardAndPassesTurn()
    {
        var state = Make(ImmutableList.Create(
            new Card(Color.Red, CardType.Nine), new Card(Color.Blue, CardType.Two)));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));

        result.State.TopCard.Should().Be(new Card(Color.Red, CardType.Nine));
        result.State.PlayerById("p1")!.Hand.Count.Should().Be(1);
        result.State.CurrentPlayer.Id.Should().Be("p2");
        result.Events.Should().Contain(e => e is CardPlayed);
    }

    [Fact]
    public void PlayCard_IllegalCard_IsRejected()
    {
        var state = Make(ImmutableList.Create(new Card(Color.Blue, CardType.Nine)));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
        result.State.Version.Should().Be(0);
    }

    [Fact]
    public void PlayCard_LastCard_EndsRound()
    {
        var state = Make(ImmutableList.Create(new Card(Color.Red, CardType.Nine)));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.Events.Should().Contain(e => e is RoundEnded);
    }

    [Fact]
    public void PlayCard_MultipleSameNumber_WhenRuleOn_PlaysAll()
    {
        var rules = RuleSet.Classic with { SameNumberMultiPlay = true };
        var state = Make(ImmutableList.Create(
            new Card(Color.Red, CardType.Nine),
            new Card(Color.Blue, CardType.Nine)), rules);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0, 1 }));
        result.State.PlayerById("p1")!.Hand.Should().BeEmpty();
        result.State.TopCard.Type.Should().Be(CardType.Nine);
    }

    [Fact]
    public void CallUno_SetsFlag()
    {
        var state = Make(ImmutableList.Create(
            new Card(Color.Red, CardType.Nine), new Card(Color.Red, CardType.One)));
        var result = Engine.Apply(state, new CallUno("p1"));
        result.State.PlayerById("p1")!.HasCalledUno.Should().BeTrue();
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Uno.Engine.Tests --filter PlayNumberCardTests`
Expected: FAIL — `PlayCard`/`CallUno` still rejected.

- [ ] **Step 3: Implement PlayLogic (shared helpers)**

```csharp
// src/Uno.Engine/Internal/PlayLogic.cs
using System.Collections.Immutable;
using Uno.Engine.Cards;
using Uno.Engine.State;

namespace Uno.Engine.Internal;

public static class PlayLogic
{
    // Validate the selected indexes form a legal play. Returns the ordered cards or null.
    public static IReadOnlyList<Card>? ResolveSelection(
        Player player, IReadOnlyList<int> indexes, GameState state)
    {
        if (indexes.Count == 0) return null;
        if (indexes.Distinct().Count() != indexes.Count) return null;
        if (indexes.Any(i => i < 0 || i >= player.Hand.Count)) return null;

        var cards = indexes.Select(i => player.Hand[i]).ToList();
        var lead = cards[0];

        if (!PlayValidation.IsPlayable(lead, state.TopCard, state.ActiveColor))
            return null;

        if (cards.Count > 1)
        {
            if (!state.Rules.SameNumberMultiPlay) return null;
            if (!lead.IsNumber) return null;
            if (cards.Any(c => c.Type != lead.Type)) return null;
        }
        return cards;
    }

    public static ImmutableList<Card> RemoveCards(ImmutableList<Card> hand, IReadOnlyList<int> indexes)
    {
        var ordered = indexes.OrderByDescending(i => i);
        var result = hand;
        foreach (var i in ordered) result = result.RemoveAt(i);
        return result;
    }
}
```

- [ ] **Step 4: Wire PlayCard and CallUno into Engine**

In `Engine.Apply`'s switch, add arms before the fallback:

```csharp
            PlayCard p => HandlePlay(state, p),
            CallUno c => HandleCallUno(state, c),
```

Add these handlers to the `Engine` class:

```csharp
    private static EngineResult HandleCallUno(GameState state, CallUno cmd)
    {
        var idx = state.Players.FindIndex(p => p.Id == cmd.PlayerId);
        if (idx < 0) return Reject(state, cmd.PlayerId, "Unknown player.");
        var players = state.Players.SetItem(idx, state.Players[idx] with { HasCalledUno = true });
        return new EngineResult(
            state with { Players = players, Version = state.Version + 1 },
            new GameEvent[] { new UnoCalled(cmd.PlayerId) });
    }

    private static EngineResult HandlePlay(GameState state, PlayCard cmd)
    {
        var player = state.CurrentPlayer;
        var cards = PlayLogic.ResolveSelection(player, cmd.HandIndexes, state);
        if (cards is null) return Reject(state, cmd.PlayerId, "Illegal play.");

        var lead = cards[0];

        // Wild and action cards are handled in later tasks; for now only
        // number cards flow through here. Non-number cards fall to a later arm.
        if (!lead.IsNumber)
            return Reject(state, cmd.PlayerId, "Card type not handled yet.");

        var newHand = PlayLogic.RemoveCards(player.Hand, cmd.HandIndexes);
        var discard = state.DiscardPile.AddRange(cards);
        var players = state.Players.SetItem(state.CurrentPlayerIndex,
            player with { Hand = newHand });

        var events = new List<GameEvent> { new CardPlayed(player.Id, cards) };

        if (newHand.IsEmpty)
        {
            events.Add(new RoundEnded(player.Id,
                new Dictionary<string, int>())); // scores filled in Task 14
            return new EngineResult(
                state with
                {
                    Players = players, DiscardPile = discard,
                    ActiveColor = lead.Color, Phase = Phase.RoundOver,
                    Version = state.Version + 1
                }, events);
        }

        var nextIndex = TurnMath.NextIndex(state.CurrentPlayerIndex, state.Direction, players.Count);
        events.Add(new TurnPassed(nextIndex));

        return new EngineResult(
            state with
            {
                Players = players, DiscardPile = discard, ActiveColor = lead.Color,
                CurrentPlayerIndex = nextIndex, Phase = Phase.AwaitingPlay,
                Version = state.Version + 1
            }, events);
    }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `dotnet test tests/Uno.Engine.Tests --filter PlayNumberCardTests`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(engine): play number cards, multi-play, UNO call, round end"
```

---

## Task 11: Action cards — Skip, Reverse, Draw Two (+ stacking)

**Files:**
- Modify: `src/Uno.Engine/Engine.cs` (extend `HandlePlay` for action cards)
- Test: `tests/Uno.Engine.Tests/ActionCardTests.cs`

**Interfaces:**
- Consumes: `PlayValidation.CanStack`, `TurnMath`.
- Produces: `HandlePlay` applies action effects: `Skip` advances an extra step (emits `TurnPassed` to the skipped-past player); `Reverse` flips `Direction` (emits `DirectionReversed`), and in a 2-player game acts as Skip; `DrawTwo` adds 2 to `PendingDraw`. When `PendingDraw > 0`, a play is legal ONLY if `CanStack` is true (otherwise rejected — player must `DrawCard`). Single-card action plays only (multi-play remains number-only).

- [ ] **Step 1: Write the failing tests**

```csharp
// tests/Uno.Engine.Tests/ActionCardTests.cs
using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class ActionCardTests
{
    private static GameState ThreePlayers(Card p1Card, Card top, RuleSet? rules = null,
        int pendingDraw = 0) => new()
    {
        Rules = rules ?? RuleSet.Classic,
        Players = ImmutableList.Create(
            new Player("p1","P1", ImmutableList.Create(p1Card, new Card(Color.Green, CardType.Three)),
                false, true, false, 0),
            new Player("p2","P2", ImmutableList.Create(new Card(Color.Green, CardType.One)),
                false, true, false, 0),
            new Player("p3","P3", ImmutableList.Create(new Card(Color.Green, CardType.Two)),
                false, true, false, 0)),
        DrawPile = ImmutableStack.CreateRange(Enumerable.Range(0, 10)
            .Select(_ => new Card(Color.Blue, CardType.Four))),
        DiscardPile = ImmutableList.Create(top),
        ActiveColor = top.IsWild ? Color.Red : top.Color,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = pendingDraw,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void Skip_AdvancesPastNextPlayer()
    {
        var state = ThreePlayers(new Card(Color.Red, CardType.Skip), new Card(Color.Red, CardType.Five));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.State.CurrentPlayer.Id.Should().Be("p3"); // p2 skipped
    }

    [Fact]
    public void Reverse_FlipsDirection()
    {
        var state = ThreePlayers(new Card(Color.Red, CardType.Reverse), new Card(Color.Red, CardType.Five));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.State.Direction.Should().Be(-1);
        result.Events.Should().Contain(e => e is DirectionReversed);
        result.State.CurrentPlayer.Id.Should().Be("p3"); // -1 from index 0 wraps to p3
    }

    [Fact]
    public void DrawTwo_AddsToPendingDraw()
    {
        var state = ThreePlayers(new Card(Color.Red, CardType.DrawTwo), new Card(Color.Red, CardType.Five));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.State.PendingDraw.Should().Be(2);
        result.State.CurrentPlayer.Id.Should().Be("p2");
    }

    [Fact]
    public void DrawTwo_OnActiveChain_WhenStackingOff_IsRejected()
    {
        var state = ThreePlayers(new Card(Color.Red, CardType.DrawTwo),
            new Card(Color.Blue, CardType.DrawTwo), pendingDraw: 2);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
    }

    [Fact]
    public void DrawTwo_OnActiveChain_WhenStackingOn_Accumulates()
    {
        var rules = RuleSet.Classic with { Stacking = StackingMode.SameType };
        var state = ThreePlayers(new Card(Color.Red, CardType.DrawTwo),
            new Card(Color.Blue, CardType.DrawTwo), rules, pendingDraw: 2);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.State.PendingDraw.Should().Be(4);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Uno.Engine.Tests --filter ActionCardTests`
Expected: FAIL — action cards currently rejected by `HandlePlay`.

- [ ] **Step 3: Extend HandlePlay for action cards**

Replace the `if (!lead.IsNumber) return Reject(...)` guard in `HandlePlay` with the following block (placed after computing `lead`, before removing cards). It enforces stacking rules and computes effects:

```csharp
        // Multi-play is number-only.
        if (cards.Count > 1 && !lead.IsNumber)
            return Reject(state, cmd.PlayerId, "Only number cards can be multi-played.");

        // If a draw chain is active, only stackable cards may be played.
        if (state.PendingDraw > 0 && !PlayValidation.CanStack(lead, state.TopCard, state.Rules))
            return Reject(state, cmd.PlayerId, "Must stack or draw the penalty.");

        // Wild cards are handled in Task 12; defer them.
        if (lead.IsWild)
            return Reject(state, cmd.PlayerId, "Wild handled later.");
```

Then, after building `newHand`, `discard`, `players`, and the base `events` list with `CardPlayed`, but BEFORE the win-check/turn-advance, insert action-effect computation. Refactor the tail of `HandlePlay` to compute `direction`, `extraSkip`, and `pendingDraw`:

```csharp
        var direction = state.Direction;
        var pendingDraw = state.PendingDraw;
        var skip = false;

        switch (lead.Type)
        {
            case CardType.Reverse:
                if (players.Count == 2) { skip = true; }      // 2-player: acts as Skip
                else { direction = -direction; events.Add(new DirectionReversed(direction)); }
                break;
            case CardType.Skip:
                skip = true;
                break;
            case CardType.DrawTwo:
                pendingDraw += 2;
                break;
        }

        if (newHand.IsEmpty)
        {
            events.Add(new RoundEnded(player.Id, new Dictionary<string, int>()));
            return new EngineResult(
                state with
                {
                    Players = players, DiscardPile = discard, ActiveColor = lead.Color,
                    Direction = direction, PendingDraw = pendingDraw,
                    Phase = Phase.RoundOver, Version = state.Version + 1
                }, events);
        }

        var steps = skip ? 2 : 1;
        var nextIndex = TurnMath.NextIndex(state.CurrentPlayerIndex, direction, players.Count, steps);
        events.Add(new TurnPassed(nextIndex));

        return new EngineResult(
            state with
            {
                Players = players, DiscardPile = discard, ActiveColor = lead.Color,
                Direction = direction, PendingDraw = pendingDraw,
                CurrentPlayerIndex = nextIndex, Phase = Phase.AwaitingPlay,
                Version = state.Version + 1
            }, events);
```

Remove the old number-only win-check/turn-advance tail so there is exactly one return path. (The earlier number-card test suite must still pass — number cards fall through the `switch` untouched with `skip=false`, `direction` unchanged, `pendingDraw` unchanged.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test tests/Uno.Engine.Tests --filter ActionCardTests`
Then run the full suite to confirm no regression: `dotnet test tests/Uno.Engine.Tests`
Expected: PASS (all tests, including PlayNumberCardTests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): Skip, Reverse, Draw Two with stacking"
```

---

## Task 12: Wild cards + color choice + Wild Draw Four

**Files:**
- Modify: `src/Uno.Engine/Engine.cs` (handle wild plays + `ChooseColor`)
- Test: `tests/Uno.Engine.Tests/WildCardTests.cs`

**Interfaces:**
- Produces: Playing a `Wild` or `WildDrawFour` moves the card to discard but sets `Phase = AwaitingColorChoice` and does NOT advance the turn until `ChooseColor` arrives. `WildDrawFour` also adds 4 to `PendingDraw`. `ChooseColor` sets `ActiveColor`, emits `ColorChosen`, then advances the turn (applying any skip from the pending state). The player who must choose is the one who played the wild (tracked via a new nullable state field `PendingWildPlayerId`).

- [ ] **Step 1: Add the PendingWildPlayerId field to GameState**

In `src/Uno.Engine/State/GameState.cs`, add:

```csharp
    public string? PendingWildPlayerId { get; init; }
```

This is nullable with a default, so existing `with` expressions and the `required` set are unaffected.

- [ ] **Step 2: Write the failing tests**

```csharp
// tests/Uno.Engine.Tests/WildCardTests.cs
using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class WildCardTests
{
    private static GameState Make(Card p1Wild, RuleSet? rules = null) => new()
    {
        Rules = rules ?? RuleSet.Classic,
        Players = ImmutableList.Create(
            new Player("p1","P1", ImmutableList.Create(p1Wild, new Card(Color.Green, CardType.Two)),
                false, true, false, 0),
            new Player("p2","P2", ImmutableList.Create(new Card(Color.Green, CardType.One)),
                false, true, false, 0)),
        DrawPile = ImmutableStack.CreateRange(Enumerable.Range(0, 10)
            .Select(_ => new Card(Color.Blue, CardType.Four))),
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void PlayWild_EntersColorChoicePhase_TurnNotAdvanced()
    {
        var state = Make(new Card(Color.Wild, CardType.Wild));
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.State.Phase.Should().Be(Phase.AwaitingColorChoice);
        result.State.CurrentPlayer.Id.Should().Be("p1"); // still p1 until color chosen
        result.State.PendingWildPlayerId.Should().Be("p1");
    }

    [Fact]
    public void ChooseColor_SetsActiveColorAndAdvancesTurn()
    {
        var state = Make(new Card(Color.Wild, CardType.Wild));
        var afterPlay = Engine.Apply(state, new PlayCard("p1", new[] { 0 })).State;
        var result = Engine.Apply(afterPlay, new ChooseColor("p1", Color.Blue));
        result.State.ActiveColor.Should().Be(Color.Blue);
        result.State.Phase.Should().Be(Phase.AwaitingPlay);
        result.State.CurrentPlayer.Id.Should().Be("p2");
        result.Events.Should().Contain(e => e is ColorChosen);
    }

    [Fact]
    public void WildDrawFour_AddsFourToPendingDraw()
    {
        var state = Make(new Card(Color.Wild, CardType.WildDrawFour));
        var afterPlay = Engine.Apply(state, new PlayCard("p1", new[] { 0 })).State;
        afterPlay.PendingDraw.Should().Be(4);
        var afterColor = Engine.Apply(afterPlay, new ChooseColor("p1", Color.Green)).State;
        afterColor.ActiveColor.Should().Be(Color.Green);
        afterColor.CurrentPlayer.Id.Should().Be("p2");
        afterColor.PendingDraw.Should().Be(4); // p2 must now draw or stack
    }

    [Fact]
    public void ChooseColor_WhenNotInChoicePhase_IsRejected()
    {
        var state = Make(new Card(Color.Wild, CardType.Wild));
        var result = Engine.Apply(state, new ChooseColor("p1", Color.Blue));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
    }
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `dotnet test tests/Uno.Engine.Tests --filter WildCardTests`
Expected: FAIL — wilds rejected, `ChooseColor` unhandled.

- [ ] **Step 4: Implement wild handling**

In `HandlePlay`, replace the `if (lead.IsWild) return Reject(...)` deferral with logic that, after removing cards and building `discard`/`players`/`events`, enters color-choice:

```csharp
        if (lead.IsWild)
        {
            var newHandW = PlayLogic.RemoveCards(player.Hand, cmd.HandIndexes);
            var playersW = state.Players.SetItem(state.CurrentPlayerIndex,
                player with { Hand = newHandW });
            var discardW = state.DiscardPile.Add(lead);
            var pendingW = state.PendingDraw + (lead.Type == CardType.WildDrawFour ? 4 : 0);

            // If this empties the hand, round ends immediately (color irrelevant).
            if (newHandW.IsEmpty)
            {
                return new EngineResult(
                    state with
                    {
                        Players = playersW, DiscardPile = discardW, PendingDraw = pendingW,
                        Phase = Phase.RoundOver, Version = state.Version + 1
                    },
                    new GameEvent[] { new CardPlayed(player.Id, new[] { lead }),
                                      new RoundEnded(player.Id, new Dictionary<string, int>()) });
            }

            return new EngineResult(
                state with
                {
                    Players = playersW, DiscardPile = discardW, PendingDraw = pendingW,
                    ActiveColor = Color.Wild, Phase = Phase.AwaitingColorChoice,
                    PendingWildPlayerId = player.Id, Version = state.Version + 1
                },
                new GameEvent[] { new CardPlayed(player.Id, new[] { lead }) });
        }
```

Add a `ChooseColor` arm to the dispatch switch: `ChooseColor cc => HandleChooseColor(state, cc),` and implement:

```csharp
    private static EngineResult HandleChooseColor(GameState state, ChooseColor cmd)
    {
        if (state.Phase != Phase.AwaitingColorChoice || state.PendingWildPlayerId != cmd.PlayerId)
            return Reject(state, cmd.PlayerId, "Not awaiting your color choice.");
        if (cmd.Color == Color.Wild)
            return Reject(state, cmd.PlayerId, "Must pick a real color.");

        var events = new List<GameEvent> { new ColorChosen(cmd.Color) };
        var nextIndex = TurnMath.NextIndex(
            state.CurrentPlayerIndex, state.Direction, state.Players.Count);
        events.Add(new TurnPassed(nextIndex));

        return new EngineResult(
            state with
            {
                ActiveColor = cmd.Color, Phase = Phase.AwaitingPlay,
                PendingWildPlayerId = null, CurrentPlayerIndex = nextIndex,
                Version = state.Version + 1
            }, events);
    }
```

Note: the out-of-turn guard in `Apply` checks `state.CurrentPlayer.Id`. During `AwaitingColorChoice` the current index is still the wild-player, so `ChooseColor` from that player passes the guard.

- [ ] **Step 5: Run tests to verify they pass**

Run: `dotnet test tests/Uno.Engine.Tests --filter WildCardTests`
Then full suite: `dotnet test tests/Uno.Engine.Tests`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(engine): Wild and Wild Draw Four with color choice"
```

---
## Task 13: Jump-In (out-of-turn identical card)

**Files:**
- Modify: `src/Uno.Engine/Engine.cs` (allow out-of-turn identical play when `JumpIn` on)
- Test: `tests/Uno.Engine.Tests/JumpInTests.cs`

**Interfaces:**
- Produces: When `Rules.JumpIn` is true, any player holding a card identical to the top (same `Color` AND `Type`) may `PlayCard` out of turn during `AwaitingPlay`. The jump resets the current player to the jumper, applies the card's normal effects, then advances from the jumper. A jump-in is rejected if the selected card is not an exact match of the top card, if it's not `AwaitingPlay`, or if a draw chain is active (`PendingDraw > 0`).

- [ ] **Step 1: Write the failing tests**

```csharp
// tests/Uno.Engine.Tests/JumpInTests.cs
using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class JumpInTests
{
    private static GameState Make(bool jumpIn) => new()
    {
        Rules = RuleSet.Classic with { JumpIn = jumpIn },
        Players = ImmutableList.Create(
            new Player("p1","P1", ImmutableList.Create(new Card(Color.Green, CardType.Two)),
                false, true, false, 0),                       // current
            new Player("p2","P2", ImmutableList.Create(
                new Card(Color.Red, CardType.Five),           // identical to top
                new Card(Color.Blue, CardType.One)),
                false, true, false, 0)),
        DrawPile = ImmutableStack.CreateRange(Enumerable.Range(0, 10)
            .Select(_ => new Card(Color.Blue, CardType.Four))),
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void JumpIn_IdenticalCard_WhenEnabled_PlaysOutOfTurn()
    {
        var state = Make(jumpIn: true);
        var result = Engine.Apply(state, new PlayCard("p2", new[] { 0 }));
        result.State.TopCard.Should().Be(new Card(Color.Red, CardType.Five));
        result.State.PlayerById("p2")!.Hand.Count.Should().Be(1);
        // After p2 jumps in, play advances from p2 -> p1.
        result.State.CurrentPlayer.Id.Should().Be("p1");
    }

    [Fact]
    public void JumpIn_WhenDisabled_IsRejected()
    {
        var state = Make(jumpIn: false);
        var result = Engine.Apply(state, new PlayCard("p2", new[] { 0 }));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
    }

    [Fact]
    public void JumpIn_NonIdenticalCard_IsRejected()
    {
        var state = Make(jumpIn: true);
        // p2 index 1 is Blue One, not identical to Red Five top.
        var result = Engine.Apply(state, new PlayCard("p2", new[] { 1 }));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Uno.Engine.Tests --filter JumpInTests`
Expected: FAIL — out-of-turn play not yet special-cased.

- [ ] **Step 3: Add jump-in handling at the top of HandlePlay**

At the very start of `HandlePlay`, before reading `state.CurrentPlayer`, detect an out-of-turn jumper and rebase the turn to them:

```csharp
    private static EngineResult HandlePlay(GameState state, PlayCard cmd)
    {
        var actingIndex = state.CurrentPlayerIndex;

        // Jump-In: an out-of-turn player may act only with an identical card.
        if (state.CurrentPlayer.Id != cmd.PlayerId)
        {
            if (!state.Rules.JumpIn || state.Phase != Phase.AwaitingPlay || state.PendingDraw > 0)
                return Reject(state, cmd.PlayerId, "Cannot play out of turn.");

            var jumperIndex = state.Players.FindIndex(p => p.Id == cmd.PlayerId);
            if (jumperIndex < 0) return Reject(state, cmd.PlayerId, "Unknown player.");

            var jumper = state.Players[jumperIndex];
            if (cmd.HandIndexes.Count != 1)
                return Reject(state, cmd.PlayerId, "Jump-in is a single identical card.");
            var jc = cmd.HandIndexes[0];
            if (jc < 0 || jc >= jumper.Hand.Count)
                return Reject(state, cmd.PlayerId, "Invalid card.");
            if (jumper.Hand[jc] != state.TopCard)
                return Reject(state, cmd.PlayerId, "Jump-in requires an identical card.");

            // Rebase current player to the jumper, then fall through to normal play.
            state = state with { CurrentPlayerIndex = jumperIndex };
            actingIndex = jumperIndex;
        }

        var player = state.CurrentPlayer;
        // ... existing resolution logic continues unchanged ...
```

The rest of `HandlePlay` already uses `state.CurrentPlayerIndex` (now the jumper) and `state.CurrentPlayer`, so effects and turn advancement work without further change.

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test tests/Uno.Engine.Tests --filter JumpInTests`
Then full suite: `dotnet test tests/Uno.Engine.Tests`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): jump-in out-of-turn identical play"
```

---

## Task 14: Round scoring + cumulative match scoring

**Files:**
- Create: `src/Uno.Engine/Internal/Scoring.cs`
- Modify: `src/Uno.Engine/Engine.cs` (fill scores in all `RoundEnded` emissions; decide `GameEnded`)
- Test: `tests/Uno.Engine.Tests/ScoringTests.cs`

**Interfaces:**
- Produces:
  - `static class Scoring { static IReadOnlyDictionary<string,int> RoundScores(GameState state, string winnerId); static int WinnerGain(GameState state, string winnerId); }` — winner gains the sum of all opponents' `HandScore`; the returned dict maps each playerId to their NEW cumulative `Score` after this round.
  - Engine, on round end, computes scores and updates `Player.Score`. If `Rules.CumulativeScoring` and the winner's new score `>= Rules.TargetScore`, emit `GameEnded(winnerId)` and set `Phase = GameOver`; otherwise `Phase = RoundOver`. With cumulative scoring OFF, the first round end is also `GameEnded`.

- [ ] **Step 1: Write the failing tests**

```csharp
// tests/Uno.Engine.Tests/ScoringTests.cs
using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.Internal;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class ScoringTests
{
    private static GameState NearWin(RuleSet rules, int p1Score = 0) => new()
    {
        Rules = rules,
        Players = ImmutableList.Create(
            new Player("p1","P1", ImmutableList.Create(new Card(Color.Red, CardType.Nine)),
                false, true, false, p1Score),
            new Player("p2","P2", ImmutableList.Create(
                new Card(Color.Blue, CardType.Seven),       // 7
                new Card(Color.Wild, CardType.Wild)),       // 50
                false, true, false, 0)),
        DrawPile = ImmutableStack.CreateRange(new[] { new Card(Color.Blue, CardType.Two) }),
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void RoundScores_WinnerGainsOpponentsHandTotal()
    {
        var state = NearWin(RuleSet.Classic);
        var scores = Scoring.RoundScores(state, "p1");
        scores["p1"].Should().Be(57); // 7 + 50 from p2's hand
    }

    [Fact]
    public void PlayLastCard_NonCumulative_EndsGame()
    {
        var state = NearWin(RuleSet.Classic);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.Events.Should().Contain(e => e is GameEnded);
        result.State.Phase.Should().Be(Phase.GameOver);
    }

    [Fact]
    public void PlayLastCard_Cumulative_BelowTarget_EndsRoundNotGame()
    {
        var rules = RuleSet.Classic with { CumulativeScoring = true, TargetScore = 500 };
        var state = NearWin(rules);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.Events.Should().Contain(e => e is RoundEnded);
        result.Events.Should().NotContain(e => e is GameEnded);
        result.State.Phase.Should().Be(Phase.RoundOver);
        result.State.PlayerById("p1")!.Score.Should().Be(57);
    }

    [Fact]
    public void PlayLastCard_Cumulative_ReachesTarget_EndsGame()
    {
        var rules = RuleSet.Classic with { CumulativeScoring = true, TargetScore = 500 };
        var state = NearWin(rules, p1Score: 450); // +57 => 507 >= 500
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.Events.Should().Contain(e => e is GameEnded);
        result.State.Phase.Should().Be(Phase.GameOver);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Uno.Engine.Tests --filter ScoringTests`
Expected: FAIL — `Scoring` missing; round end currently emits empty scores and never `GameEnded`.

- [ ] **Step 3: Implement Scoring**

```csharp
// src/Uno.Engine/Internal/Scoring.cs
using Uno.Engine.State;

namespace Uno.Engine.Internal;

public static class Scoring
{
    public static int WinnerGain(GameState state, string winnerId)
        => state.Players.Where(p => p.Id != winnerId).Sum(p => p.HandScore);

    public static IReadOnlyDictionary<string, int> RoundScores(GameState state, string winnerId)
    {
        var gain = WinnerGain(state, winnerId);
        return state.Players.ToDictionary(
            p => p.Id,
            p => p.Id == winnerId ? p.Score + gain : p.Score);
    }
}
```

- [ ] **Step 4: Add a shared round-end helper to Engine and use it everywhere**

Add this helper to the `Engine` class:

```csharp
    // Centralized round/game-end builder. `players` is post-play state (winner's hand empty).
    private static EngineResult EndRound(
        GameState state, ImmutableList<Player> players, string winnerId,
        ImmutableList<Card> discard, Color activeColor, int direction, int pendingDraw,
        List<GameEvent> events)
    {
        var scored = Scoring.RoundScores(
            state with { Players = players }, winnerId);

        var updatedPlayers = players
            .Select(p => p with { Score = scored[p.Id] })
            .ToImmutableList();

        var winnerScore = scored[winnerId];
        var gameOver = !state.Rules.CumulativeScoring || winnerScore >= state.Rules.TargetScore;

        events.Add(new RoundEnded(winnerId, scored));
        if (gameOver) events.Add(new GameEnded(winnerId));

        return new EngineResult(
            state with
            {
                Players = updatedPlayers, DiscardPile = discard, ActiveColor = activeColor,
                Direction = direction, PendingDraw = pendingDraw,
                Phase = gameOver ? Phase.GameOver : Phase.RoundOver,
                Version = state.Version + 1
            }, events);
    }
```

Then replace BOTH places in `HandlePlay` that currently do
`events.Add(new RoundEnded(player.Id, new Dictionary<string,int>())); return new EngineResult(...Phase.RoundOver...)`
(the number/action path and the wild path) with a call to `EndRound`, passing the computed `discard`, `lead.Color` (or `state.ActiveColor` for wild — keep the existing color the wild leaves, which is `Color.Wild`), `direction`, and `pendingDraw`. For the wild path the `events` list already contains `CardPlayed`; for the number/action path it contains `CardPlayed` (+ any `DirectionReversed`).

Concretely, the number/action win branch becomes:

```csharp
        if (newHand.IsEmpty)
            return EndRound(state, players, player.Id, discard, lead.Color,
                            direction, pendingDraw, events);
```

and the wild win branch becomes:

```csharp
            if (newHandW.IsEmpty)
            {
                var evW = new List<GameEvent> { new CardPlayed(player.Id, new[] { lead }) };
                return EndRound(state, playersW, player.Id, discardW, Color.Wild,
                                state.Direction, pendingW, evW);
            }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `dotnet test tests/Uno.Engine.Tests --filter ScoringTests`
Then full suite: `dotnet test tests/Uno.Engine.Tests`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(engine): round scoring and cumulative game-over"
```

---

## Task 15: Forced UNO call penalty (CatchUno)

**Files:**
- Modify: `src/Uno.Engine/Engine.cs` (handle `CatchUno`)
- Test: `tests/Uno.Engine.Tests/CatchUnoTests.cs`

**Interfaces:**
- Produces: `CatchUno(catcherId, targetId)` is valid only when `Rules.ForcedUnoPenalty` is on, the target has exactly one card, and `HasCalledUno` is false. On a valid catch, the target draws `Rules.UnoPenaltyCards` and emits `PenaltyApplied`. The catch window: open from when the target reaches one card until that target next acts (tracked by `HasCalledUno` staying false and hand size == 1). Invalid catches are rejected (no state change). `CatchUno` is allowed out of turn (it's in the `Apply` guard exception list already).

- [ ] **Step 1: Write the failing tests**

```csharp
// tests/Uno.Engine.Tests/CatchUnoTests.cs
using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class CatchUnoTests
{
    private static GameState Make(bool forced, bool targetCalled) => new()
    {
        Rules = RuleSet.Classic with { ForcedUnoPenalty = forced, UnoPenaltyCards = 2 },
        Players = ImmutableList.Create(
            new Player("p1","P1", ImmutableList.Create(new Card(Color.Green, CardType.Two)),
                false, true, false, 0),
            new Player("p2","P2", ImmutableList.Create(new Card(Color.Red, CardType.Nine)),
                targetCalled, true, false, 0)),  // p2 has 1 card
        DrawPile = ImmutableStack.CreateRange(Enumerable.Range(0, 5)
            .Select(_ => new Card(Color.Blue, CardType.Four))),
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void CatchUno_TargetForgotToCall_AppliesPenalty()
    {
        var state = Make(forced: true, targetCalled: false);
        var result = Engine.Apply(state, new CatchUno("p1", "p2"));
        result.State.PlayerById("p2")!.Hand.Count.Should().Be(3); // 1 + 2 penalty
        result.Events.Should().Contain(e => e is PenaltyApplied);
    }

    [Fact]
    public void CatchUno_TargetCalledUno_IsRejected()
    {
        var state = Make(forced: true, targetCalled: true);
        var result = Engine.Apply(state, new CatchUno("p1", "p2"));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
    }

    [Fact]
    public void CatchUno_RuleOff_IsRejected()
    {
        var state = Make(forced: false, targetCalled: false);
        var result = Engine.Apply(state, new CatchUno("p1", "p2"));
        result.Events.Should().ContainSingle(e => e is CommandRejected);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Uno.Engine.Tests --filter CatchUnoTests`
Expected: FAIL — `CatchUno` unhandled.

- [ ] **Step 3: Implement CatchUno**

Add dispatch arm `CatchUno cu => HandleCatchUno(state, cu),` and:

```csharp
    private static EngineResult HandleCatchUno(GameState state, CatchUno cmd)
    {
        if (!state.Rules.ForcedUnoPenalty)
            return Reject(state, cmd.PlayerId, "UNO penalty rule is off.");

        var idx = state.Players.FindIndex(p => p.Id == cmd.TargetId);
        if (idx < 0) return Reject(state, cmd.PlayerId, "Unknown target.");

        var target = state.Players[idx];
        if (target.Hand.Count != 1 || target.HasCalledUno)
            return Reject(state, cmd.PlayerId, "Nothing to catch.");

        var (pile, discard, rngState, drawn) =
            Internal.DrawLogic.DrawCards(state, state.Rules.UnoPenaltyCards);
        var players = state.Players.SetItem(idx,
            target with { Hand = target.Hand.AddRange(drawn) });

        return new EngineResult(
            state with
            {
                Players = players, DrawPile = pile, DiscardPile = discard,
                RngState = rngState, Version = state.Version + 1
            },
            new GameEvent[] { new PenaltyApplied(cmd.TargetId, drawn.Count, "Failed to call UNO") });
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test tests/Uno.Engine.Tests --filter CatchUnoTests`
Then full suite: `dotnet test tests/Uno.Engine.Tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): forced UNO call penalty via CatchUno"
```

---
## Task 16: Seven-Zero (hand swap on 7, rotate on 0)

**Files:**
- Modify: `src/Uno.Engine/Engine.cs` (handle 7 → AwaitingSevenTarget; 0 → rotate; `ChooseSevenSwapTarget`)
- Test: `tests/Uno.Engine.Tests/SevenZeroTests.cs`

**Interfaces:**
- Produces: When `Rules.SevenZero` is on: playing a `7` moves it to discard, sets `Phase = AwaitingSevenTarget` and `PendingWildPlayerId = player.Id` (reused as "the player choosing a target"), and waits — turn not advanced. `ChooseSevenSwapTarget(playerId, targetId)` swaps the two players' hands, emits `HandsSwapped`, then advances the turn. Playing a `0` rotates ALL hands one seat in the play direction, emits `HandsRotated`, then advances normally. When the rule is off, 7 and 0 behave as ordinary number cards (existing behavior). Edge: playing your last `7`/`0` ends the round (no swap/rotate needed).

- [ ] **Step 1: Write the failing tests**

```csharp
// tests/Uno.Engine.Tests/SevenZeroTests.cs
using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class SevenZeroTests
{
    private static Player P(string id, params Card[] cards) =>
        new(id, id, ImmutableList.Create(cards), false, true, false, 0);

    private static GameState Make(Card p1Lead, Card extra, bool sevenZero) => new()
    {
        Rules = RuleSet.Classic with { SevenZero = sevenZero },
        Players = ImmutableList.Create(
            P("p1", p1Lead, extra),
            P("p2", new Card(Color.Green, CardType.One)),
            P("p3", new Card(Color.Yellow, CardType.Two))),
        DrawPile = ImmutableStack.CreateRange(Enumerable.Range(0, 5)
            .Select(_ => new Card(Color.Blue, CardType.Four))),
        DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
        ActiveColor = Color.Red,
        CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
        Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
    };

    [Fact]
    public void PlaySeven_EntersTargetPhase_ThenSwapsHands()
    {
        var state = Make(new Card(Color.Red, CardType.Seven), new Card(Color.Red, CardType.One), true);
        var afterPlay = Engine.Apply(state, new PlayCard("p1", new[] { 0 })).State;
        afterPlay.Phase.Should().Be(Phase.AwaitingSevenTarget);

        var result = Engine.Apply(afterPlay, new ChooseSevenSwapTarget("p1", "p3"));
        // p1 had 1 card left (Red One); p3 had 1 card (Yellow Two) -> swapped.
        result.State.PlayerById("p1")!.Hand.Should().ContainSingle()
            .Which.Should().Be(new Card(Color.Yellow, CardType.Two));
        result.State.PlayerById("p3")!.Hand.Should().ContainSingle()
            .Which.Should().Be(new Card(Color.Red, CardType.One));
        result.Events.Should().Contain(e => e is HandsSwapped);
    }

    [Fact]
    public void PlayZero_RotatesAllHandsInDirection()
    {
        var state = Make(new Card(Color.Red, CardType.Zero), new Card(Color.Red, CardType.One), true);
        // Direction +1: each player's hand moves to the next seat.
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        // p1 played the 0 (now holds Red One). After rotation in +1 direction,
        // hands shift so p2 receives p1's remaining hand.
        result.Events.Should().Contain(e => e is HandsRotated);
    }

    [Fact]
    public void PlaySeven_WhenRuleOff_BehavesAsNumberCard()
    {
        var state = Make(new Card(Color.Red, CardType.Seven), new Card(Color.Red, CardType.One), false);
        var result = Engine.Apply(state, new PlayCard("p1", new[] { 0 }));
        result.State.Phase.Should().Be(Phase.AwaitingPlay);
        result.State.CurrentPlayer.Id.Should().Be("p2");
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Uno.Engine.Tests --filter SevenZeroTests`
Expected: FAIL — Seven-Zero not implemented.

- [ ] **Step 3: Implement Seven-Zero in HandlePlay + ChooseSevenSwapTarget**

In `HandlePlay`, after computing `newHand`/`players`/`discard`/`events` for a NUMBER card but before the generic turn-advance, special-case 7 and 0 when the rule is on and the hand is not empty:

```csharp
        if (state.Rules.SevenZero && lead.IsNumber && !newHand.IsEmpty)
        {
            if (lead.Type == CardType.Seven)
            {
                return new EngineResult(
                    state with
                    {
                        Players = players, DiscardPile = discard, ActiveColor = lead.Color,
                        Phase = Phase.AwaitingSevenTarget, PendingWildPlayerId = player.Id,
                        Version = state.Version + 1
                    }, events);
            }
            if (lead.Type == CardType.Zero)
            {
                var rotated = RotateHands(players, state.Direction);
                events.Add(new HandsRotated(state.Direction));
                var nextIdx = TurnMath.NextIndex(state.CurrentPlayerIndex, state.Direction, players.Count);
                events.Add(new TurnPassed(nextIdx));
                return new EngineResult(
                    state with
                    {
                        Players = rotated, DiscardPile = discard, ActiveColor = lead.Color,
                        CurrentPlayerIndex = nextIdx, Phase = Phase.AwaitingPlay,
                        Version = state.Version + 1
                    }, events);
            }
        }
```

Add helpers to `Engine`:

```csharp
    private static ImmutableList<Player> RotateHands(ImmutableList<Player> players, int direction)
    {
        var hands = players.Select(p => p.Hand).ToList();
        var n = players.Count;
        // In play direction +1, seat i receives the hand from seat (i - 1).
        var rotated = new ImmutableList<Card>[n];
        for (var i = 0; i < n; i++)
        {
            var source = TurnMath.NextIndex(i, -direction, n);
            rotated[i] = hands[source];
        }
        return players.Select((p, i) => p with { Hand = rotated[i], HasCalledUno = false })
                      .ToImmutableList();
    }
```

Add dispatch arm `ChooseSevenSwapTarget st => HandleSevenTarget(state, st),` and:

```csharp
    private static EngineResult HandleSevenTarget(GameState state, ChooseSevenSwapTarget cmd)
    {
        if (state.Phase != Phase.AwaitingSevenTarget || state.PendingWildPlayerId != cmd.PlayerId)
            return Reject(state, cmd.PlayerId, "Not awaiting your swap target.");
        if (cmd.TargetId == cmd.PlayerId)
            return Reject(state, cmd.PlayerId, "Choose another player.");

        var aIdx = state.Players.FindIndex(p => p.Id == cmd.PlayerId);
        var bIdx = state.Players.FindIndex(p => p.Id == cmd.TargetId);
        if (bIdx < 0) return Reject(state, cmd.PlayerId, "Unknown target.");

        var a = state.Players[aIdx];
        var b = state.Players[bIdx];
        var players = state.Players
            .SetItem(aIdx, a with { Hand = b.Hand })
            .SetItem(bIdx, b with { Hand = a.Hand });

        var events = new List<GameEvent> { new HandsSwapped(cmd.PlayerId, cmd.TargetId) };
        var nextIdx = TurnMath.NextIndex(state.CurrentPlayerIndex, state.Direction, players.Count);
        events.Add(new TurnPassed(nextIdx));

        return new EngineResult(
            state with
            {
                Players = players, Phase = Phase.AwaitingPlay,
                PendingWildPlayerId = null, CurrentPlayerIndex = nextIdx,
                Version = state.Version + 1
            }, events);
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test tests/Uno.Engine.Tests --filter SevenZeroTests`
Then full suite: `dotnet test tests/Uno.Engine.Tests`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): Seven-Zero hand swap and rotate"
```

---

## Task 17: Wild Draw Four challenge

**Files:**
- Modify: `src/Uno.Engine/Engine.cs` (open challenge window on WD4 when toggled; handle `Challenge`)
- Test: `tests/Uno.Engine.Tests/ChallengeTests.cs`

**Interfaces:**
- Produces: When `Rules.WildDrawFourChallenge` is on, after the WD4 player chooses a color the next player enters `Phase = AwaitingChallenge` (instead of immediately drawing). That player may `Challenge` or `DrawCard` (accept). `Challenge` inspects the WD4-player's hand AT THE TIME THE WD4 WAS PLAYED for any card matching the color that was active before the wild: if illegal (they had a match), the WD4-player draws 4 and the turn passes to the challenger; if legal (no match), the challenger draws 6 and is skipped. To inspect the prior hand, store `ChallengeContext` in state: `record ChallengeContext(string PlayedById, Color PriorColor, ImmutableList<Card> PlayerHandAtPlay)`.

- [ ] **Step 1: Add nullable ChallengeContext to GameState**

In `src/Uno.Engine/State/GameState.cs` add:

```csharp
    public ChallengeContext? Challenge { get; init; }
```

And create the record in the same file (or a new `State/ChallengeContext.cs`):

```csharp
// src/Uno.Engine/State/ChallengeContext.cs
using System.Collections.Immutable;
using Uno.Engine.Cards;

namespace Uno.Engine.State;

public record ChallengeContext(string PlayedById, Color PriorColor, ImmutableList<Card> PlayerHandAtPlay);
```

- [ ] **Step 2: Write the failing tests**

```csharp
// tests/Uno.Engine.Tests/ChallengeTests.cs
using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine;
using Uno.Engine.Cards;
using Uno.Engine.Commands;
using Uno.Engine.Events;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class ChallengeTests
{
    // p1 plays WD4 while holding a Red card (illegal) on a Red active color.
    private static GameState Make(bool p1HasMatch)
    {
        var p1Hand = ImmutableList.Create(
            new Card(Color.Wild, CardType.WildDrawFour),
            p1HasMatch ? new Card(Color.Red, CardType.Three) : new Card(Color.Blue, CardType.Three));
        return new GameState
        {
            Rules = RuleSet.Classic with { WildDrawFourChallenge = true },
            Players = ImmutableList.Create(
                new Player("p1","P1", p1Hand, false, true, false, 0),
                new Player("p2","P2", ImmutableList.Create(new Card(Color.Green, CardType.One)),
                    false, true, false, 0)),
            DrawPile = ImmutableStack.CreateRange(Enumerable.Range(0, 12)
                .Select(_ => new Card(Color.Blue, CardType.Four))),
            DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.Five)),
            ActiveColor = Color.Red,
            CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
            Phase = Phase.AwaitingPlay, Version = 0, RngSeed = 1, RngState = 1
        };
    }

    private static GameState PlayWd4ThenColor(GameState s)
    {
        var afterPlay = Engine.Apply(s, new PlayCard("p1", new[] { 0 })).State;
        return Engine.Apply(afterPlay, new ChooseColor("p1", Color.Green)).State;
    }

    [Fact]
    public void AfterWd4Color_NextPlayerEntersChallengePhase()
    {
        var state = PlayWd4ThenColor(Make(p1HasMatch: true));
        state.Phase.Should().Be(Phase.AwaitingChallenge);
        state.CurrentPlayer.Id.Should().Be("p2");
    }

    [Fact]
    public void Challenge_WhenPlayerHadMatch_PunishesPlayer()
    {
        var state = PlayWd4ThenColor(Make(p1HasMatch: true));
        var result = Engine.Apply(state, new Challenge("p2"));
        // p1 illegally played WD4 -> p1 draws 4, p2 plays next.
        result.State.PlayerById("p1")!.Hand.Count.Should().Be(1 + 4); // had 1 left + 4
        result.State.PendingDraw.Should().Be(0);
        result.State.CurrentPlayer.Id.Should().Be("p2");
        result.Events.Should().Contain(e => e is PenaltyApplied);
    }

    [Fact]
    public void Challenge_WhenPlayerHadNoMatch_PunishesChallenger()
    {
        var state = PlayWd4ThenColor(Make(p1HasMatch: false));
        var result = Engine.Apply(state, new Challenge("p2"));
        // Legal WD4 -> challenger draws 6 and is skipped.
        result.State.PlayerById("p2")!.Hand.Count.Should().Be(1 + 6);
        result.State.CurrentPlayer.Id.Should().Be("p1");
    }

    [Fact]
    public void AcceptWd4ByDrawing_DrawsFourNoChallenge()
    {
        var state = PlayWd4ThenColor(Make(p1HasMatch: true));
        var result = Engine.Apply(state, new DrawCard("p2"));
        result.State.PlayerById("p2")!.Hand.Count.Should().Be(1 + 4);
        result.State.Challenge.Should().BeNull();
    }
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `dotnet test tests/Uno.Engine.Tests --filter ChallengeTests`
Expected: FAIL — challenge flow not implemented.

- [ ] **Step 4: Implement the challenge flow**

In the wild branch of `HandlePlay`, when the card is `WildDrawFour` and `Rules.WildDrawFourChallenge` is on, capture the context BEFORE removing cards from the hand:

```csharp
            ChallengeContext? challenge = null;
            if (lead.Type == CardType.WildDrawFour && state.Rules.WildDrawFourChallenge)
                challenge = new ChallengeContext(player.Id, state.ActiveColor, player.Hand);
```

Carry `challenge` into the `AwaitingColorChoice` state (`Challenge = challenge`).

In `HandleChooseColor`, after setting the color, branch: if `state.Challenge is not null`, do NOT advance to a normal turn — instead set `Phase = AwaitingChallenge` and move current player to the next player (the potential challenger), leaving `PendingDraw` (4) intact and keeping `Challenge` set. Otherwise behave as before.

```csharp
        if (state.Challenge is not null)
        {
            var challengerIndex = TurnMath.NextIndex(
                state.CurrentPlayerIndex, state.Direction, state.Players.Count);
            return new EngineResult(
                state with
                {
                    ActiveColor = cmd.Color, Phase = Phase.AwaitingChallenge,
                    PendingWildPlayerId = null, CurrentPlayerIndex = challengerIndex,
                    Version = state.Version + 1
                },
                new GameEvent[] { new ColorChosen(cmd.Color) });
        }
```

Add dispatch arm `Challenge ch => HandleChallenge(state, ch),` and implement:

```csharp
    private static EngineResult HandleChallenge(GameState state, Challenge cmd)
    {
        if (state.Phase != Phase.AwaitingChallenge || state.Challenge is null)
            return Reject(state, cmd.PlayerId, "Nothing to challenge.");
        if (state.CurrentPlayer.Id != cmd.PlayerId)
            return Reject(state, cmd.PlayerId, "Not your challenge.");

        var ctx = state.Challenge;
        var hadMatch = ctx.PlayerHandAtPlay.Any(c =>
            !c.IsWild && c.Color == ctx.PriorColor);

        var events = new List<GameEvent>();
        GameState newState;

        if (hadMatch) // illegal WD4: player who played it draws the 4
        {
            var playedIdx = state.Players.FindIndex(p => p.Id == ctx.PlayedById);
            var (pile, discard, rng, drawn) = Internal.DrawLogic.DrawCards(state, state.PendingDraw);
            var players = state.Players.SetItem(playedIdx,
                state.Players[playedIdx] with { Hand = state.Players[playedIdx].Hand.AddRange(drawn) });
            events.Add(new PenaltyApplied(ctx.PlayedById, drawn.Count, "Illegal Wild Draw Four"));
            // Turn stays with the challenger (they were skipped of the draw).
            newState = state with
            {
                Players = players, DrawPile = pile, DiscardPile = discard, RngState = rng,
                PendingDraw = 0, Phase = Phase.AwaitingPlay, Challenge = null,
                Version = state.Version + 1
            };
        }
        else // legal WD4: challenger draws PendingDraw + 2 and is skipped
        {
            var penalty = state.PendingDraw + 2;
            var (pile, discard, rng, drawn) = Internal.DrawLogic.DrawCards(state, penalty);
            var challengerIdx = state.CurrentPlayerIndex;
            var players = state.Players.SetItem(challengerIdx,
                state.CurrentPlayer with { Hand = state.CurrentPlayer.Hand.AddRange(drawn) });
            events.Add(new PenaltyApplied(cmd.PlayerId, drawn.Count, "Failed challenge"));
            var nextIdx = TurnMath.NextIndex(challengerIdx, state.Direction, players.Count);
            events.Add(new TurnPassed(nextIdx));
            newState = state with
            {
                Players = players, DrawPile = pile, DiscardPile = discard, RngState = rng,
                PendingDraw = 0, CurrentPlayerIndex = nextIdx, Phase = Phase.AwaitingPlay,
                Challenge = null, Version = state.Version + 1
            };
        }
        return new EngineResult(newState, events);
    }
```

Finally, in `HandleDraw`, when `state.Phase == Phase.AwaitingChallenge` (player accepts the WD4 by drawing), clear `Challenge` after the draw. Add `Challenge = null` to the `state with { ... }` in `HandleDraw`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `dotnet test tests/Uno.Engine.Tests --filter ChallengeTests`
Then full suite: `dotnet test tests/Uno.Engine.Tests`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(engine): Wild Draw Four challenge flow"
```

---

## Task 18: Determinism property test + new-round reset

**Files:**
- Create: `src/Uno.Engine/Setup/RoundReset.cs`
- Test: `tests/Uno.Engine.Tests/DeterminismTests.cs`, `tests/Uno.Engine.Tests/RoundResetTests.cs`

**Interfaces:**
- Produces: `static class RoundReset { static GameState StartNextRound(GameState finished, int seed); }` — keeps `Players` identity and cumulative `Score`, re-deals a fresh shuffled deck, resets hands/discard/draw/phase, advances the dealer. Only valid when `Phase == RoundOver`.
- Determinism test: replaying the same seed + identical command list yields byte-identical final `GameState` (excluding nothing — full structural equality).

- [ ] **Step 1: Write the failing tests**

```csharp
// tests/Uno.Engine.Tests/DeterminismTests.cs
using FluentAssertions;
using Uno.Engine;
using Uno.Engine.Commands;
using Uno.Engine.Setup;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class DeterminismTests
{
    [Fact]
    public void SameSeedAndCommands_ProduceIdenticalState()
    {
        var seats = new[] { ("p1","P1",false), ("p2","P2",false) };

        GameState Run()
        {
            var s = GameSetup.NewGame(seats, RuleSet.Classic, seed: 12345);
            // A fixed sequence: current player draws, then next draws, repeated.
            for (var i = 0; i < 6; i++)
                s = Engine.Apply(s, new DrawCard(s.CurrentPlayer.Id)).State;
            return s;
        }

        Run().Should().BeEquivalentTo(Run());
    }
}
```

```csharp
// tests/Uno.Engine.Tests/RoundResetTests.cs
using System.Collections.Immutable;
using FluentAssertions;
using Uno.Engine.Cards;
using Uno.Engine.Setup;
using Uno.Engine.State;
using Xunit;

namespace Uno.Engine.Tests;

public class RoundResetTests
{
    [Fact]
    public void StartNextRound_PreservesScores_RedealsHands()
    {
        var finished = new GameState
        {
            Rules = RuleSet.Classic with { CumulativeScoring = true },
            Players = ImmutableList.Create(
                new Player("p1","P1", ImmutableList<Card>.Empty, false, true, false, 120),
                new Player("p2","P2", ImmutableList.Create(new Card(Color.Red, CardType.One)),
                    false, true, false, 30)),
            DrawPile = ImmutableStack<Card>.Empty,
            DiscardPile = ImmutableList.Create(new Card(Color.Red, CardType.One)),
            ActiveColor = Color.Red, CurrentPlayerIndex = 0, Direction = 1, PendingDraw = 0,
            Phase = Phase.RoundOver, Version = 9, RngSeed = 1, RngState = 1
        };

        var next = RoundReset.StartNextRound(finished, seed: 777);
        next.Players.Should().OnlyContain(p => p.Hand.Count == 7);
        next.PlayerById("p1")!.Score.Should().Be(120); // preserved
        next.PlayerById("p2")!.Score.Should().Be(30);
        next.Phase.Should().Be(Phase.AwaitingPlay);
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/Uno.Engine.Tests --filter "DeterminismTests|RoundResetTests"`
Expected: DeterminismTests may already pass (engine is deterministic); RoundResetTests FAIL — `RoundReset` missing.

- [ ] **Step 3: Implement RoundReset**

```csharp
// src/Uno.Engine/Setup/RoundReset.cs
using Uno.Engine.State;

namespace Uno.Engine.Setup;

public static class RoundReset
{
    public static GameState StartNextRound(GameState finished, int seed)
    {
        var seats = finished.Players
            .Select(p => (p.Id, p.Name, p.IsBot))
            .ToList();

        var fresh = GameSetup.NewGame(seats, finished.Rules, seed);

        // Carry cumulative scores forward.
        var players = fresh.Players
            .Select(p => p with { Score = finished.PlayerById(p.Id)!.Score })
            .ToImmutableList();

        return fresh with { Players = players, Version = finished.Version + 1 };
    }
}
```

Add `using System.Collections.Immutable;` to the file.

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test tests/Uno.Engine.Tests --filter "DeterminismTests|RoundResetTests"`
Then the FULL suite: `dotnet test tests/Uno.Engine.Tests`
Expected: PASS (entire engine suite green).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(engine): deterministic replay test and next-round reset"
```

---

## Engine Plan — Done

At this point `Uno.Engine` is feature-complete for the slice: full card play, all action/wild cards, every toggleable house rule (Stacking, Draw-to-match, Jump-In, Seven-Zero, Forced UNO penalty, same-number multi-play, cumulative scoring, Wild Draw Four challenge), deterministic shuffling, scoring, and round reset — all unit-tested. The next plan (`Uno.Server`) consumes `Engine.Apply`, `GameSetup.NewGame`, `RoundReset.StartNextRound`, and the `Command`/`GameEvent`/`GameState` types exactly as defined here.

## Follow-on plans (separate documents, written after this plan is executed)

- **Plan 2 — `Uno.Server`:** ASP.NET Core host, `GameHub` (SignalR), `GameRegistry`, per-game `GameActor` (Channel-based command loop), redacted per-player state projection, AI bot driver, reconnection by `PlayerId`, EF Core `MatchHistory` persistence to MySQL. Consumes the engine as a library.
- **Plan 3 — Frontend:** Next.js (App Router, TS) + React Three Fiber 3D table, sprite-atlas card textures from `uno_classic.png`, SignalR client, lobby/join-code flow, animation queue driven by `GameEvents`, Wild color picker, UNO/Catch/Jump-In UX.

Each will be created via the writing-plans skill in turn, so the engine's real, tested interfaces are locked before the server plan is written, and the server's real hub contract is locked before the frontend plan.
