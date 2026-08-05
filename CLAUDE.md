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

### Win screen (`src/components/WinScreen.tsx`)

The post-win surface for all three puzzle modes: a native `<dialog>` opened with `showModal()`, so it sits in the browser's top layer and is not subject to `#main-display`'s overflow or the Chocolate HUD's stacking context. It takes `won` and owns its own dismissed state — showing, stepping aside ("admire puzzle"), and the recall control that brings it back are one behaviour, not the caller's business. Two slots keep mode-specific content out: `stats` (Chocolate's SCORE/GLEANED) and `actions`.

The panel renders **one transcript — `clue`, then `answer`, then `winMessage`** — because that is how the content was written. Of the 115 earned-win puzzles carrying a `winMessage`, 104 are conversational: the clue opens a sentence the answer completes and the message continues (`LATER YOU WILL ENCODE` / `HOMEWORK` / `BUT FOR NOW…`), or the message replies to the answer (`ENCODING IS FUN!` / `IT SURE IS!`). Showing the message alone strands it. The panel scrolls, which only matters for the dozen puzzles whose three parts exceed a screenful.

`answer` is a `ReactNode`, not a string. Encode and Decode pass `puzzle.winText`; **Chocolate passes what the player actually gleaned**, one `<span>` per letter, teal for correct and purple for not — a Dessert run is won by surviving the conveyor, not by being right, so the received message can be full of holes. This is what `letterResults` is kept whole for. `.win-screen-answer` sets `white-space: pre-wrap` so the per-letter spans don't collapse the spaces between words.

`actions` is the route's after-win navigation (Next, Share, back to category). Routes pass it to `PlayPuzzle` as `winActions`; `PlayPuzzle` hands it to whichever mode renders, and the mode decides where it goes. Routes therefore hold no `hasWon` state of their own.

**Two kinds of puzzle skip the screen and keep an inline `#win-message` panel plus plain `.after-win-controls`.** Both are decided by `winsInline = isAutoWin || winInline` in the mode, where `winInline` is the mechanism and the route sets the policy. `LevelPlay` sets it via `isTutorialContent()` (`src/tutorialContent.ts`), which matches the string "tutorial" in the route name, menu name, category, level name, or puzzle slug — a deliberately blunt rule, because ~15 tutorial puzzles teach by pointing at the bit grid (`SEE HOW THE BIT WENT FROM PURPLE TO GREEN?`, and one whose whole message is `SEE?`) and no field marks them. Note the word appears nowhere in `docs/VintagePuzzles.json` — there it is purely the route segment `App.tsx` passes as `menuName`. Chocolate has no inline win to fall back to and always uses the screen.

The other kind is auto-win puzzles (`init === winText`). They are the tutorial's demo screens: most carry no `winMessage` at all (their content is the `clue`), and the ones that do use it to caption the bits above — `clue: ["THIS IS A BIT"]`, `winMessage: ["IT IS .ON."]`. A modal there covers the very thing the screen exists to show. `useBasePuzzle`'s `hasWon` is the flag that drives this, and it must stay there: a parent's own copy gets cleared by its reset before the button renders (#223).

Note: jsdom implements `<dialog>` without `showModal()`, so the component falls back to the `open` attribute in tests. Visibility still works (jsdom applies `dialog:not([open]) { display: none }`, so `queryByRole` correctly excludes a closed screen) but the top layer and focus trap only exist in a real browser.

### Story mode (`src/components/StoryPage.tsx`, `StoryIndex.tsx`)

A paginated text reader for narrative content stored as Markdown files in `src/assets/story/`. The story list is defined in `src/stories.ts`. Routes: `/story` (index) and `/story/:slug` (individual chapter).

`StoryPage` is a terminal-style viewer with these key behaviors:
- **Font sizing** — on mount and resize, `measure()` computes a scale factor (`containerWidth / (38 * charWidth)`) and sets `font-size` on `.story-page` so exactly 38 characters always fit the viewport. `cols` and `rows` are derived from the same scale factor so pagination is always consistent.
- **Pagination** — `buildLines()` word-wraps prose and preserves code-fence blocks verbatim (no strip/wrap). `paginateLines()` slices into pages of `rows` lines each, stripping leading blank lines per page.
- **Navigation** — arrow keys / spacebar / click advances pages; `▲`/`▼` buttons and prev/next story links are in the `<nav>`.
- **`#main-display.paginated`** must have `flex: 1; min-height: 0` so `ResizeObserver` doesn't fire spuriously when font size changes (which would cause an infinite measurement loop).

The `text-transform: uppercase` global on `#root` is suppressed for the whole story page via `text-transform: none` on `.story-page`.

### Colors

See [COLORS.md](COLORS.md) for the full palette, semantic roles, and the sprite-based bit-state color system.

### Feature flags

Routes beyond `/today`/`/date/...`/`/tutorial/...` are gated by `useFeatureFlags()` (`src/hooks/useFeatureFlags.ts`). Flags are delivered as a signed JWT (`?features=<token>`) verified against an RSA public key embedded in the source. The default feature set is `['tutorial']`.
