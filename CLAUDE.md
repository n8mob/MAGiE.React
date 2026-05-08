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

MAGiE is a binary-encoding puzzle game built as a React 18 SPA with React Router v6. There are three gameplay modes:
- **Daily puzzle** (`/today`, `/date/:year/:month/:day`) — fetches from the puzzle API by date
- **Menu-based play** (`/tutorial/...`, `/mall/...`, `/bigGame/...`) — navigates Menu → Category → Level → Puzzle
- **Door Lock** (`/doorLock`) — standalone generative/random puzzle mode; see below

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

### Door Lock (`src/components/DoorLock.tsx`)

A self-contained puzzle mode with a simple state machine (`idle → entering → accepted | rejected`). It has two separate `BitSequence` states:
- **`stagingBits`** — live input from the on-screen buttons / keyboard, shown in a MAGiE device staging display. Persists between rounds so the player can re-use a previously correct sequence on the next lock.
- **`cardBits`** — committed guess, transferred from staging on Enter/submit, shown in the main display

The player types bits into the staging area and presses Enter to "swipe" the virtual card. Judgment runs against `cardBits`, not `stagingBits`. Individual staging bits can be toggled by clicking them. On a wrong guess, the hint shows the signed numeric difference (`WIN - GUESS`) to guide the player.

`DoorLock` accepts a `BinaryEncoder` and an optional `presets?: string[]` prop. Win sequences are drawn from `presets` in order; once exhausted (or if no presets are provided), new sequences are generated randomly. The win audio (`/sounds/big-ta-da.wav`) is preloaded on mount with `preload = "auto"` and rewound to `currentTime = 0` before each play to support replays.

### Bit button components (`src/components/BitButton.tsx`)

Two components share the same `<input type="checkbox" className="bit-checkbox">` base. Both set `data-bit-index={bit.index}` on the input, which click/change handlers read via `event.target.dataset.bitIndex` to identify which bit was toggled.
- **`BitButton`** — no `data-correctness` attribute; renders with the default (dark/black) sprites. Use when correctness is unknown or irrelevant (e.g. `DoorLock`).
- **`CorrectnessBitButton`** — requires a `correctness: Correctness` prop; sets `data-correctness` which drives CSS sprite switching (yellow = unguessed, teal = correct, purple = incorrect). Use wherever judgment feedback is shown.

### DisplayMatrix (`src/components/DisplayMatrix.tsx`)

Renders a grid of bit buttons from `DisplayRow[]`. Accepts a `renderBit: (bit: IndexedBit, rowIndex: number, indexWithinRow: number) => ReactNode` render prop — callers supply the button component and close over any click/change handlers. The inner grid div uses `className="bit-field"` (not an `id`) so multiple `DisplayMatrix` instances can coexist on the same page (e.g. DoorLock's card + staging displays). Exposes an imperative ref handle (`DisplayMatrixUpdate`) with `getWidth()`, `scrollToBottom()`, and `getBitRowElement(rowIndex)`.

### Feature flags

Routes beyond `/today`/`/date/...`/`/tutorial/...` are gated by `useFeatureFlags()` (`src/hooks/useFeatureFlags.ts`). Flags are delivered as a signed JWT (`?features=<token>`) verified against an RSA public key embedded in the source. The default feature set is `['tutorial']`.
