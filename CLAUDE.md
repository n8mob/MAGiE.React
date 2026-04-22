# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server at magiegame.local:5173 (uses vite.config.local.ts)
npm run build      # TypeScript compile + Vite production build
npm run lint       # ESLint (zero warnings allowed)
npx vitest         # Run all tests
npx vitest run src/test/BitSequence.test.ts  # Run a single test file
```

The dev config (`vite.config.local.ts`) expects `magiegame.local` to resolve in `/etc/hosts` and proxies `/puzzle-api/*` to `VITE_MAGIE_PUZZLE_API` from `.env.local`. Production target is `https://puzzles.magiegame.com`.

## Architecture

MAGiE is a binary-encoding puzzle game built as a React 18 SPA with React Router v6. There are two gameplay modes:
- **Daily puzzle** (`/today`, `/date/:year/:month/:day`) — fetches from the puzzle API by date
- **Menu-based play** (`/tutorial/...`, `/mall/...`, `/bigGame/...`) — navigates Menu → Category → Level → Puzzle

### Data flow

1. `PuzzleApi.ts` fetches `Menu` or `PuzzleForDate` from the API (with `localStorage` caching and `If-Modified-Since` headers).
2. `model.ts` defines the shape: `Menu` → `Category` → `Level` → `Puzzle`. `Menu` instantiates `encodingProviders` (a map of encoding name → `BinaryEncoder`) from the raw JSON.
3. Route components (`LevelPlay`, `DatePlay`) use hooks (`useMenu`, `useCategory`, `useLevel`) to load data, then pass a `Puzzle` down to `PlayPuzzle`.
4. `PlayPuzzle` dispatches to `EncodePuzzle` or `DecodePuzzle` depending on `puzzle.type`.

### Core bit types (`src/`)

- `IndexedBit` — a single `"0" | "1"` with a global index (its position in the full bit string of a puzzle).
- `BitSequence` — an immutable sequence of `IndexedBit`s. All mutations return new instances. Used for all encode/decode operations.
- `encoding/DisplayRow` — extends `BitSequence` with an optional decoded character annotation for rendering.

### Encoding (`src/encoding/`)

`BinaryEncoder` interface with two implementations:
- `FixedWidthEncoder` — every character is `width` bits; uses an `encodingMap`.
- `VariableWidthEncoder` — custom run-length/unary encoding ("alpha-length"). Characters are grouped by their encoding bit (`"0"` or `"1"`); each character in a group is encoded as a run of that bit (e.g. A=`1`, B=`11`, C=`111`). Adjacent characters from the same group are separated by a single opposite bit. The nested map is keyed by group bit, then by character.

Both implement `splitByChar()` (for judgment) and `splitForDisplay()` (for rendering rows).

### Judgment (`src/judgment/`)

`BaseBinaryJudge` compares a guess `BitSequence` against a win `BitSequence`, producing a `FullJudgment` containing `SequenceJudgment[]` (one per character) and `BitJudgment[]` (one per bit, with `Correctness.correct | incorrect | hidden`). Separate judge classes exist for fixed/variable width, encode/decode.

### Header context

`HeaderContext` (in `src/components/HeaderContext.tsx`) is a React context that lets route-level components push dynamic content into the app header (category/level breadcrumbs or date navigation) via `useHeader()`. The header auto-collapses when the user scrolls past 72 px and re-expands on a pull-down gesture.

### Feature flags

Routes beyond `/today`/`/date/...`/`/tutorial/...` are gated by `useFeatureFlags()` (`src/hooks/useFeatureFlags.ts`). Flags are delivered as a signed JWT (`?features=<token>`) verified against an RSA public key embedded in the source. The default feature set is `['tutorial']`.
