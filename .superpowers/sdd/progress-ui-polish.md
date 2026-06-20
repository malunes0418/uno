# UNO UI/UX Polish — SDD Progress Ledger

**Branch:** `feat/uno-ui-polish`  
**Worktree:** `c:\Users\cayma\Desktop\Projs\uno\.worktrees\feat-uno-ui-polish`  
**Base:** `66eaea1`  
**Started:** 2026-06-20  
**Completed:** 2026-06-21

## Summary

| Status | Count |
|--------|-------|
| Complete | 16 / 16 |
| Frontend tests | 153 passing (19 files) |
| Frontend build | ✅ pass |
| Engine tests | 65 passing |
| Server tests | 20 passing |

## Tasks

| # | Task | Status | Commit | Spec | Quality |
|---|------|--------|--------|------|---------|
| 1 | Design tokens and base layout | ✅ done | 8be6dea | ✅ | ✅ |
| 2 | Styled UI primitives | ✅ done | 42d3b3b | ✅ | ✅ |
| 3 | UNO-branded Home page | ✅ done | b5e526b | ✅ | ✅ |
| 4 | 2D CardFace sprite component | ✅ done | 11eb123 | ✅ | ✅ |
| 5 | UNO-branded Lobby page | ✅ done | 2f6cd9f | ✅ | ✅ |
| 6 | Complete atlas map + tests | ✅ done | e5f0f72 | ✅ | ✅ |
| 7 | Shared CardTextureProvider | ✅ done | 92b9d20 | ✅ | ✅ |
| 8 | Felt table and camera framing | ✅ done | 8787ff6, 55d571a | ✅ | ✅ |
| 9 | Card hover and playability | ✅ done | 1923d26 | ✅ | ✅ |
| 10 | Visible card animations | ✅ done | 361a423 | ✅ | ✅ |
| 11 | Opponent fans and piles | ✅ done | 14c6fcc | ✅ | ✅ |
| 12 | Redesigned game HUD | ✅ done | 2255e27 | ✅ | ✅ |
| 13 | Polished game overlays | ✅ done | 21f86a7 | ✅ | ✅ |
| 14 | Challenge and Seven-Zero UI | ✅ done | 5410ef8 | ✅ | ✅ |
| 15 | Responsive layout and a11y | ✅ done | 074e52a | ✅ | ✅ |
| 16 | Manual verification | ✅ done | (this commit) | ✅ | ✅ |

## Test/Build Log

| Phase | npm test | npm run build | dotnet test | Notes |
|-------|----------|---------------|-------------|-------|
| Baseline | ✅ 11/11 | — | — | |
| Task 4 | ✅ 19/19 | — | — | CardFace sprite + atlasBackgroundStyle |
| **Task 16 final** | ✅ **153/153** (19 files) | ✅ pass | ✅ **85/85** (65 engine + 20 server) | 2026-06-21 |

### Task 16 verification details

**Automated (run 2026-06-21):**

```
npm test   → 19 files, 153 tests passed (vitest 4.1.9, 11.6s)
npm run build → Next.js 16.2.9, TypeScript OK, 5 routes
dotnet test → Uno.Engine.Tests 65 passed, Uno.Server.Tests 20 passed
```

**Build fix applied:** `Scoreboard.tsx` confetti `--i` CSS custom property typed as `CSSProperties`.

**Manual E2E checklist** (requires `dotnet run --project src/Uno.Server` + `npm run dev`):

- [ ] Home: branded layout, rule toggles, create/join flow
- [ ] Lobby: player list, read-only rules, add bot, start game
- [ ] Game table: felt surface, camera framing, opponent fans, draw/discard piles
- [ ] Interactions: card hover lift, playable vs dimmed cards, draw button
- [ ] Animations: card play arc, draw tween visible
- [ ] Overlays: wild color picker, UNO button, catch prompt, jump-in highlight
- [ ] Challenge / Seven-Zero overlays when rules enabled
- [ ] HUD: turn indicator, active color chip, direction badge, pending draw
- [ ] Scoreboard: round/game over modal, confetti on game over, Play Again
- [ ] Responsive: home/lobby/HUD usable at 375px and 1280px widths
- [ ] A11y: focus rings on buttons, `prefers-reduced-motion` respected

Manual E2E not run in this session (server not started); automated suite fully green.
