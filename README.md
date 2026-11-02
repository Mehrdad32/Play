# M32 Playground 🎮

**One more game. One more high score.**

[![CI](https://github.com/Mehrdad32/Play/actions/workflows/ci.yml/badge.svg)](https://github.com/Mehrdad32/Play/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-34D399.svg)](LICENSE)
[![Website](https://img.shields.io/badge/Play-play.mehrdad32.ir-34D399.svg)](https://play.mehrdad32.ir/)

**M32 Playground** is an open-source, mobile-first collection of fast browser games created by **Mehrdad32**. No accounts, backend, analytics, advertisements, or tracking. Your progress lives on your device.

**[Launch Playground](https://play.mehrdad32.ir/)** · **[Mehrdad32 main website](https://mehrdad32.ir/)** · **[Source](https://github.com/Mehrdad32/Play)**

## Interface preview

| Playground | M32 Merge |
| --- | --- |
| Emerald/dark game catalog · bilingual Persian/English · responsive | 4 × 4 board · score · best score · special **M32** tile · stats |

```text
    M32 MERGE                 SCORE  032
    ┌─────┬─────┬─────┬─────┐
    │  2  │  4  │  8  │ 16  │
    ├─────┼─────┼─────┼─────┤
    │     │ ✦32 │ 64  │     │   ← special M32 tile
    ├─────┼─────┼─────┼─────┤
    │     │ 128 │ 256 │     │
    ├─────┼─────┼─────┼─────┤
    │     │     │ 512 │1024 │
    └─────┴─────┴─────┴─────┘
```

See the **[live visual preview](https://play.mehrdad32.ir/)**. This is an illustrative board, not a fabricated screenshot.

## Game catalog

| Game | Status |
| --- | --- |
| **M32 Merge** — custom 2048 with a special 16+16→32 celebration | Playable |
| **Reaction 32** — reflex timing, 32 Rush, Precision and Duel | **Playable** |
| **HEX Hunter** — color-decoding, odd-one-out, RGB mixing and daily | **Playable** |
| **Memory Bits** — four-mode 4×4 memory challenge | **Playable** |
| **Terminal Escape** — five-layer simulated terminal adventure | **Playable** |

**All five games are implemented and playable.** The original five-game catalog is complete.

## M32 Merge highlights

- Standard 4×4 sliding and single-merge rules; 2/4 tile spawning with a 90/10 split
- Win at 2048, continue beyond it, game-over detection, pause/resume, restart confirmation, one-step undo
- **M32 signature:** emerald 32 tile, glow/particle effect **only upon a 16+16 merge**, per-game 32 merge counter, first-M32 achievement
- Arrow keys, touch swipe, optional audio (disabled by default), configurable animation and `prefers-reduced-motion`
- Automatic resume, local best score, wins, games played, highest tile, last-played timestamp, cumulative M32 count
- Persian RTL and English LTR UI; consistent left-to-right board in both languages; accessibility focus rings
- Share result via Web Share API with clipboard fallback
- Offline-ready PWA: precached assets and SPA navigation after the service worker installs

## Terminal Escape — the second playable game

**Route:** `/games/terminal-escape`

A complete, bilingual, mobile-friendly interactive fiction/puzzle game. Escape the fictional M32 lab through **five progressively unlocked security layers**: Access Gate, File System, Network, Control Core and Final Exit.

- A realistic-looking terminal window with entirely **simulated commands** (no shell, process, network or external APIs).
- Discover clues using `ls`, `cat`, `cd`, `scan`, `ping`, `status`, and game-specific puzzle commands.
- A pure, deterministic puzzle engine independent of React; stages cannot be skipped by entering the final commands without discovering their prerequisites.
- Context-aware quick-command chips for touch devices, a text input, command history via ↑ and ↓, multilingual hints and help.
- Scoring penalizes wasted commands, incorrect guesses and hints, rewards the secret **M32** Easter egg.
- Auto-saves current run and progress to localStorage. Tracks attempts, successful escapes, best score, fastest escape and fewest commands.
- End-game results, replay and Web Share API / clipboard fallback.
- Respects the application's dark emerald style and reduced-motion preference.

Terminal-specific local keys are `m32.playground.v1.terminalEscape.session` and `m32.playground.v1.terminalEscape.stats`. The game uses no credentials, real commands or tracking.

### How to play

Open the game from the homepage. Try `help` or `ls`, read the files and follow the clues. On mobile, tap the quick-command suggestions. Use `hint` if stuck, or `map` to inspect your progress. To finish, unlock all five layers. The challenge can be replayed and the game resumes automatically after a refresh.

## Memory Bits — Glitch Protocol

**Route:** `/games/memory-bits`

A complete and mobile-first 4×4 pattern memory game featuring four genuinely distinct modes:

- **Classic:** watch a growing sequence of glowing cells and repeat it in order.
- **Reverse:** memorize the same display, then enter the steps in reverse.
- **Glitch:** ignore short purple fake flashes and replay only the green signal sequence.
- **Daily:** eight seeded rounds shared by everyone on the same **UTC day** with no server or API. Daily patterns reset at **00:00 UTC**.

Each round extends the real pattern by one tile. The first round begins with two steps; finishing round 32 in the endless modes unlocks a persistent **M32 achievement**. Score increases with round progression and a successful streak; wrong answers end the run.

The pure `src/games/memory-bits/engine` contains deterministic seeded pattern generation, cue generation, stage transitions, score calculation, and a strict input phase. Playback and touch animations are managed in the UI only. It can be unit tested without a browser.

### Controls, storage and accessibility

- Tap the 16 large cells or use keyboard rows `1234` / `QWER` / `ASDF` / `ZXCV`.
- Watch the sequence before input; buttons disable during playback. Interruption/reload during playback safely returns to `ready` rather than silently skipping the signal.
- Sound is optional/off by default. Flash transitions respect `prefers-reduced-motion` and the global animation setting.
- Selected mode's session resumes after refresh. Stats, best score and best combo are tracked separately by mode. Browser Local Storage retains the achievement, daily score by UTC date, and lifetime totals.
- No online leaderboard, external services, tracking, credentials or registration; sharing uses Web Share API or clipboard fallback.
- Versioned and validated storage keys: `m32.playground.v1.memoryBits.session.<mode>`, `m32.playground.v1.memoryBits.stats`.

## HEX Hunter — the fourth playable game

**Route:** `/games/hex-hunter`

Bilingual, mobile-first arcade game with four distinct color challenges:

- **HEX Decode:** see a 6-digit `#RRGGBB` code and select its actual swatch from four increasingly close options.
- **Odd One Out:** find the subtly different color in 3×3, 4×4 and 5×5 boards.
- **RGB Mix Lab:** use real 0–255 R/G/B sliders to approximate a target; difficulty adjusts allowed Euclidean RGB distance.
- **Daily Hunt:** eight deterministic rotating puzzles shared for the same UTC date, with no API, backend, account or online leaderboard.

Three lives per run; valid answers update the streak and score. Local records are isolated per mode, and the 32nd round unlocks the persistent M32 achievement. Results can be shared via the Web Share API or clipboard fallback. Sessions and stats are stored only in localStorage under `m32.playground.v1.hexHunter.*`, with validation on restore. Responsive interactions remain within the viewport without horizontal page scrolling. The engine is pure and deterministically testable without a DOM.

## Reaction 32 — the fifth and final arcade game

**Route:** `/games/reaction-32`

Four playable reflex modes, designed mobile-first:

- **Classic:** five unpredictable signals; median reaction time, fastest reaction and personal best.
- **32 Rush:** a real 32-second monotonic-clock run with rapid random intervals, unlimited trials, speed/streak scoring and early-tap penalties. Earn the M32 badge by hitting 32 valid signals in the time limit.
- **Precision:** ten attempts and purple decoy signals. The only correct response to a decoy is **not** to touch it; resisted decoys do not consume attempts. Tapping purple or tapping before green counts as a false start.
- **Duel:** two players alternate on one device, five attempts each. Winner is determined by the lower median reaction time, then fewer false starts in the event of a tie.

Signals are randomized and input-gated using a pure engine. The React runner timestamps input with `performance.now()`, including mobile pointer-down, while the Rush deadline is also monotonic. Results are displayed in **milliseconds**. Hidden-tab interruptions cancel the current cue or end a timed Rush to prevent skewed measurements. Device input latency, display refresh rate, and browser timing limits can affect the absolute measurements.

Local records are stored under `m32.playground.v1.reaction32.stats` only (no realtime session restore since stale timers are invalid after refresh). Scoring and stats are tested independently of the UI; there is no backend, tracking, ranking service or account requirement. Persian RTL, English LTR, touch and keyboard input, user-controlled sound, share result and the accessible visible GO/STOP states are supported.

### Completed arcade

**Five games, five distinct mechanics:** M32 Merge, Reaction 32, HEX Hunter, Memory Bits and Terminal Escape. Each has an independent engine and namespaced storage. All five game cards on the homepage link to real playable routes. The platform remains open-source (MIT) and deploys through GitHub-connected Cloudflare Pages.

## Run locally

Requires **Node.js 22.12+**.

```bash
git clone https://github.com/Mehrdad32/Play.git
cd Play
npm install
npm run dev
```

Open the local URL printed by Vite. Run the quality checks:

```bash
npm run lint
npm run test
npm run build
npm run preview
```

Routes: `/`, `/games/m32-merge`, `/games/reaction-32`, `/games/terminal-escape`, `/games/memory-bits`, `/games/hex-hunter`, `/about`. The UI language toggle is persisted locally and keeps the current route.

## Architecture

```text
src/
  App.tsx                       # routing, landing, about, localization
  games/
    catalog.ts                  # extensible game registry
    reaction-32/
      engine/index.ts           # pure time-aware reaction rules
      engine/engine.test.ts     # mode, scoring, turn and fake-out tests
      storage.ts                # separate local personal bests
      storage.test.ts           # record and corruption tests
      Reaction32Page.tsx        # monotonic-clock UI, cues and tap control
    memory-bits/
      engine/index.ts           # pure seeded 4-mode memory rules
      engine/engine.test.ts     # deterministic patterns, scoring, modes
      storage.ts                # isolated resumable game storage
      storage.test.ts           # recovery, daily records, persistence
      MemoryBitsPage.tsx        # flash playback, touch/keyboard, score UI
    terminal-escape/
      engine/index.ts           # pure stage transition / text adventure engine
      engine/engine.test.ts     # puzzle progression, scoring, safety
      storage.ts                # isolated resumable game persistence
      storage.test.ts           # save/restore, invalid data, stats
      TerminalEscapePage.tsx    # console UI and mobile command suggestions
    m32-merge/
      engine/index.ts           # pure deterministic 2048 state machine
      tests/engine.test.ts      # movement, scoring, win, undo, achievement
      MergePage.tsx             # game UI, effects, keyboard/swipe
  lib/storage/index.ts         # namespaced local persistence and validation
  styles/index.css             # dark emerald design system and animation
public/
  _redirects                   # Cloudflare Pages SPA fallback
  _headers                     # response security headers
  favicon.svg                  # temporary marked M32 icon (replaceable)
```

The **engine is UI-independent** and accepts an injected RNG for deterministic tests. All gameplay derives from the engine's returned state and merge events. Display logic never decides whether a merge is legal.

### Add another game

1. Add `src/games/<slug>/` with a pure engine, UI component and tests.
2. Add one catalog entry in `src/games/catalog.ts`. Switch to `status: 'live'` and give it a URL when playable.
3. Register that route in `src/App.tsx`.
4. Namespace its storage under `m32.playground.v1.<slug>.*` using the shared local storage conventions.
5. Run lint, tests and build before shipping.

## Storage and privacy

Records are stored **only in this browser on this device** (not cloud-synchronized). Keys:

- `m32.playground.v1.merge.bestScore`
- `m32.playground.v1.merge.stats`
- `m32.playground.v1.merge.session`
- `m32.playground.v1.settings`
- `m32.playground.v1.terminalEscape.session`
- `m32.playground.v1.terminalEscape.stats`
- `m32.playground.v1.memoryBits.session.<mode>`
- `m32.playground.v1.memoryBits.stats`

Invalid/old JSON is ignored without crashing. Reset Stats is confirmed and does not delete the active game. Clearing the site's browser data erases all local records. Lifetime statistics count merges when they occur; undo reverts the active game counter but does not retract a lifetime accomplishment. The namespaced storage adapter can later be replaced with cloud sync without rewriting the game engine.

## Deploy to Cloudflare Pages

Create a **Pages → Connect to Git** project:

| Setting | Value |
| --- | --- |
| GitHub repository | `Mehrdad32/Play` |
| Production branch | `main` |
| Project name | `m32-playground` |
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js | `22` (set `NODE_VERSION=22` if necessary) |
| Custom domain | `play.mehrdad32.ir` |

Point the custom domain to the Pages deployment using Cloudflare Pages' **Custom domains** panel, then wait for the SSL certificate to become active. The included `public/_redirects` provides history-mode SPA route fallback for direct links and browser refresh. `vite-plugin-pwa` precaches the built app for offline visits **after initial online load and successful service-worker installation**. No secrets, paid services, backend, or API keys are required.

GitHub Actions runs lint, unit tests and the production build on `main`, feature branches and PRs.

## Branding and license

Designed to visually complement **[Mehrdad32.ir](https://mehrdad32.ir/)** (near-black background, emerald/mint accents, Vazirmatn Persian UI). The `TEMP`-labeled M32 icon is a **temporary brand placeholder**; replace with the approved binary logo once its reusable asset is available.

Created by **Mehrdad32** · Copyright © 2026 Mehrdad32.

Licensed under the [MIT License](LICENSE). Original creator credit and the copyright notice must be retained in copies and substantial portions.
