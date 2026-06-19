# UNO Classic — 3D Multiplayer Game (Design Spec)

**Date:** 2026-06-19
**Status:** Approved design; ready for implementation planning.

## Context

We are building a web-based **UNO Classic** card game with a 3D presentation and real-time online multiplayer. The motivation is to deliver a complete, faithful UNO experience that supports **all the common house rules** (toggleable per room), playable with friends online via shareable join codes, with an attractive 3D table built on the provided card sprite sheet (`uno_classic.png`).

The target stack is **Next.js + Three.js** on the frontend, a **.NET (ASP.NET Core) + SignalR** backend, and **MySQL** for persistence. SignalR over WebSockets is the chosen transport — it is the right fit for a turn-based game on a .NET stack (native reconnection, groups, fallbacks) and avoids re-implementing what raw WebSockets would require.

Intended outcome: a **vertical slice first** — a thin but end-to-end playable game (rooms, real-time play, 3D table, a basic AI opponent) with the full rules engine behind it — then layer additional polish. Building the slice first de-risks the multi-system integration before investing in breadth.

### Key decisions (from brainstorming)
- **Build approach:** Full vertical slice first.
- **House rules:** ALL of the below, each individually **toggleable** at room creation: Stacking +2/+4, Draw-to-match, Jump-In, Seven-Zero, Forced UNO call penalty, same-number multi-play, cumulative scoring. (Wild Draw Four challenge also included as a toggle.)
- **Multiplayer:** Online rooms with **join codes**. **Guest play** (no accounts) — display name per session.
- **AI:** Include a **basic rule-based AI opponent** so one human can play.
- **3D:** A **3D table with sprite-textured cards** (textured planes from the atlas), animated deal/play/draw, hover/lift, Wild color picker.
- **Transport:** **SignalR over WebSockets.**
- **Persistence:** **In-memory live game state; MySQL stores finished-game history** (schema account-ready).
- **Backend core architecture:** **Approach A** — a pure rules-engine library + a per-game actor (Channel-based) owning state; the SignalR hub is a thin pass-through.

## System Architecture

Three deployable pieces plus a database:

```
┌─────────────────────────┐         SignalR/WebSocket          ┌──────────────────────────┐
│   Next.js client (TS)    │ ◄────────────────────────────────► │   .NET Web API host       │
│  - React UI + lobby      │      (typed hub: commands up,       │  - GameHub (SignalR)      │
│  - Three.js 3D table      │       state/events down)            │  - GameRegistry           │
│  - SignalR client        │                                     │  - per-game Actor (Channel)│
└─────────────────────────┘                                     │  - Uno.Engine (pure lib)  │
                                                                  │  - AI bot driver          │
                                                                  └────────────┬─────────────┘
                                                                               │ EF Core
                                                                               ▼
                                                                       ┌──────────────┐
                                                                       │   MySQL      │
                                                                       │ match history│
                                                                       └──────────────┘
```

### .NET solution projects
- **`Uno.Engine`** — pure rules library. NO dependency on ASP.NET, SignalR, or EF. C# records + pure functions only.
- **`Uno.Server`** — ASP.NET Core host: `GameHub`, `GameRegistry`, per-game `GameActor`, AI bot driver, EF Core persistence.
- **`Uno.Engine.Tests`** — xUnit; the bulk of test effort lives here.
- **`Uno.Server.Tests`** — integration tests for hub/actor flow.

### Frontend
One Next.js app (App Router, TypeScript): a Three.js scene (via React Three Fiber) for the table, plus a thin React layer for menus, the join-code lobby, and the HUD.

### Data flow
Client sends a typed **Command** → hub posts it to the game's channel → `GameActor` calls `Uno.Engine` → engine returns `(newState, events)` → actor broadcasts a **redacted per-player state projection** + the ordered **event list** (for animation) → on game end, actor writes a match record to MySQL.

## Component: Uno.Engine (rules core)

Pure, immutable, fully unit-testable. The engine is the contract; everything else is plumbing.

### Card model
```csharp
enum Color { Red, Yellow, Green, Blue, Wild }
enum CardType { Zero, One, Two, Three, Four, Five, Six, Seven, Eight, Nine,
                Skip, Reverse, DrawTwo, Wild, WildDrawFour }
record Card(Color Color, CardType Type);
```
- **`DeckFactory`** builds the canonical 108-card deck: per color (R/Y/G/B) one `0`, two each `1–9`, two each `Skip`/`Reverse`/`DrawTwo`; plus four `Wild` and four `WildDrawFour`. A test asserts the count/composition.
- **Scoring values:** number cards = face value; `Skip`/`Reverse`/`DrawTwo` = 20; `Wild`/`WildDrawFour` = 50.

### Game state (immutable record)
```
GameState {
  RuleSet Rules
  IReadOnlyList<Player> Players      // Player: Id, Hand, HasCalledUno, Connected, Score, IsBot
  ImmutableStack<Card> DrawPile
  ImmutableList<Card> DiscardPile
  Color ActiveColor                  // declared color for wilds
  int CurrentPlayerIndex
  int Direction                      // +1 / -1
  int PendingDraw                    // accumulated +2/+4 stack
  Phase Phase                        // AwaitingPlay, AwaitingColorChoice,
                                     // AwaitingSevenTarget, AwaitingChallenge, RoundOver, GameOver
  int Version                        // monotonic; stale-move rejection
  int RngSeed                        // server-side deterministic shuffle
}
```

### Core function
```
(GameState, Command) → Result(newState, IReadOnlyList<GameEvent>)
```
- Invalid commands return a **rejection event**, not an exception; state unchanged.
- **Commands:** PlayCard, DrawCard, ChooseColor, CallUno, CatchUno, ChooseSevenSwapTarget, Challenge.
- **GameEvents** (animation contract): CardPlayed, CardsDrawn, TurnPassed, DirectionReversed, ColorChosen, UnoCalled, PenaltyApplied, HandsSwapped, HandsRotated, RoundEnded, GameEnded, CommandRejected.

### RuleSet (toggles, set at room creation, validated once)
| Rule | Engine behavior |
|---|---|
| `StackingMode` (None / SameType / TwoAndFourInterchangeable) | facing `PendingDraw>0`, may add a stackable card vs. draw the total |
| `DrawToMatch` | draw until playable vs. draw exactly one then pass |
| `JumpIn` | identical card (same color+type) playable out of turn; play continues from jumper |
| `SevenZero` | 7 → `AwaitingSevenTarget` then swap hands; 0 → rotate all hands in play direction |
| `ForcedUnoPenalty` | `HasCalledUno` flag + `CatchUno` command within catch window; penalty draw if caught |
| `SameNumberMultiPlay` | play multiple same-number cards in one move |
| `CumulativeScoring` | multi-round to a target score (default 500) vs. single-round win |
| `WildDrawFourChallenge` | optional challenge window inspecting the player's hand |

### Edge cases (each gets an explicit test)
- **Draw-pile exhaustion:** reshuffle the discard pile *except the top card* into a new draw pile; cap a required draw at available cards.
- **First flipped card is action/Wild:** action card takes effect on first player; if `WildDrawFour`, return it and re-flip.
- **2-player Reverse** acts as Skip.
- **UNO catch-window timing:** window opens when a player reaches one card and closes when that player next acts.
- **Wild Draw Four legality/challenge** (when toggled): only legal if player holds no card matching current color; correct challenge → player draws 4; wrong challenge → challenger draws 6.

Determinism: given `RngSeed` + the command sequence, a game is fully reproducible (supports debugging and future event-sourcing).

## Component: Uno.Server

### GameHub (SignalR) — thin pass-through
Authenticates the connection (guest: display name + stable `PlayerId` token), maps `ConnectionId → PlayerId`. Never mutates game state directly.

```
Client → Server:  CreateRoom(ruleSet, displayName)
                  JoinRoom(code, displayName)
                  AddBot(code)
                  StartGame(code)
                  SendCommand(code, command, lastSeenVersion)

Server → Client:  RoomUpdated(roomState)            // lobby: players, ruleset, host
                  GameStateUpdated(redactedState)    // own hand full, others as counts
                  GameEvents(events[])               // ordered, for animation
                  CommandRejected(reason)
                  Error(message)
```

### GameRegistry
Concurrent map of room code → `GameActor`. Generates unique 6-char join codes; manages room lifecycle (create, join, host-start, dispose when empty/finished).

### GameActor (one per game) — the concurrency guarantee
Owns one `GameState`; consumes commands from a `Channel<Command>` **one at a time**. Per command:
1. Reject if `lastSeenVersion` is stale.
2. Call `Uno.Engine`.
3. On new state: broadcast redacted projections to each player's connections + the event list to the room group.
4. If the new current player is a **bot**, schedule the bot driver.
5. On `GameOver`: write the match record to MySQL, then dispose.

This single-consumer channel is what makes **Jump-In** safe: first command to be processed wins; later conflicting commands re-validate against fresh state and are rejected.

### AI bot driver
Invoked when it's a bot's turn. Simple rule-based policy: play a valid card (prefer action/matching-color to shed points), choose the most-held color for wilds, call UNO at one card, draw when stuck. Posts **normal commands** to the same channel — bots traverse the identical validated path as humans. A small randomized think-delay for natural pacing.

### Reconnection & disconnect policy
- State keyed by `PlayerId` (not `ConnectionId`). On reconnect, hub re-maps and resends the current redacted snapshot; the player resumes their hand.
- Slice policy: game continues; a disconnected player's turn **auto-draws/passes** after a timeout.

### Persistence (EF Core + MySQL)
Only finished games. One `MatchHistory` table: id, room code, started/ended timestamps, ruleset (JSON), players (JSON: names, final scores, placement), winner, nullable `UserId` (account-ready). Live game state stays in memory.

### Security posture (slice)
Unauthenticated guest access; anyone with a room code can join. No rate-limiting/abuse protection yet. Acceptable for a friends slice; **must be revisited before any public deployment.**

## Component: Frontend (Next.js + Three.js)

### Stack
Next.js (App Router, TypeScript), `@microsoft/signalr`, `three` + `@react-three/fiber` + `@react-three/drei`, Zustand for client state.

### Screen flow
```
Home → enter display name → [Create Room] or [Join with code]
  → Lobby: player list, host toggles house-rule switches, [Add Bot], [Start]
  → Game: 3D table
  → Round/Game over: scores, [Play Again]
```

### 3D table (centerpiece)
- Scene: felt table; central **draw pile** + **discard pile**; own hand fanned at bottom; opponents (face-down counts) around the edges.
- **Cards = textured planes.** `uno_classic.png` is sliced via UV offsets into a `cardAtlas` lookup (`Card → {u,v,w,h}`); one texture + one material serves all 108 faces + the back. The atlas-coordinate map is generated from the sheet layout.
- **Animations** driven by the `GameEvents` stream: deal, play (arc + flip to discard), draw, Reverse (direction spin), Wild (color burst + picker overlay), Skip, hand-swap/rotate (Seven-Zero). Each event type → a tween.
- **Interaction:** hover lifts a card; clicking a legal card sends `PlayCard`; illegal cards dimmed. Client does optimistic legality for responsiveness, but **server is authoritative** — `CommandRejected` snaps state back. Wild → color picker; "UNO!" button at two cards; "Catch!" prompt when an opponent forgets UNO.

### State sync
`GameStateUpdated` is the source of truth (replaces local state). `GameEvents` drive an animation queue. Every command carries `lastSeenVersion`; stale plays (e.g. late Jump-In) are cleanly rejected.

### Jump-In UX
When enabled, holding the identical card to the discard top highlights it for immediate out-of-turn play; the server's first-wins channel resolves the race.

### Responsiveness
3D canvas scales to viewport; HUD (current player, direction, active color, pending-draw count, turn indicator) is React/CSS overlaid on the canvas.

## Testing Strategy

- **Engine (primary):** xUnit unit tests for each card effect, each house-rule toggle, and each edge case (deck composition, reshuffle, 2-player Reverse, first-card-action, UNO catch window, Wild Draw Four challenge, stacking chains, Seven-Zero swap/rotate). Property/determinism test: same seed + commands → same state.
- **Server:** integration tests for the actor command loop, stale-version rejection, Jump-In race resolution, bot turn-taking, reconnection snapshot.
- **End-to-end (manual for slice):** create room → add bot → play a full round in the 3D client, verifying animations match events.

## Out of Scope (for the slice)
Accounts/auth, matchmaking lobby, persistent live-game resume, spectators, chat, mobile-native apps, advanced AI, anti-cheat hardening, public-deployment security.

## Verification

End-to-end check once the slice is built:
1. Run MySQL (Docker), apply EF migrations.
2. Start `Uno.Server`; start the Next.js client.
3. Browser A: create a room, toggle a few house rules, **Add Bot**, Start.
4. Browser B: join with the code; confirm both see synced 3D state.
5. Play a full round: verify deal/play/draw animations, Wild color picker, Skip/Reverse, a stacking chain, a Seven-Zero swap, an UNO call + catch, and round/game end.
6. Confirm a `MatchHistory` row is written on game end.
7. Run `dotnet test` — engine + server suites green.
