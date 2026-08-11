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
- **Menu-based play** (`/tutorial/...`, `/vintage/...`, `/bigGame/...`, `/mall/...`, `/chocolate/...`) — navigates Menu → Category → Level → Puzzle. All of these mount the same `LevelPlay` with a different `menuName`; `/chocolate` additionally passes `asChocolate`, which forces every puzzle in the area into Chocolate mode.
- **Door Lock** (`/doorLock`) — standalone generative/random puzzle mode; see below

### Data flow

1. `PuzzleApi.ts` fetches `Menu` or `PuzzleForDate` from the API (with `localStorage` caching and `If-Modified-Since` headers).
2. `model.ts` defines the shape: `Menu` → `Category` → `Level` → `Puzzle`. `Menu` instantiates `encodingProviders` (a map of encoding name → `BinaryEncoder`) from the raw JSON.
3. Route components (`LevelPlay`, `DatePlay`) use hooks (`useMenu`, `useCategory`, `useLevel`) to load data, then pass a `Puzzle` down to `PlayPuzzle`.
4. `PlayPuzzle` dispatches to `EncodePuzzle`, `DecodePuzzle` or `ChocolateMode` depending on `puzzle.type`. It also resolves the type: the `asChocolate` prop (the `/chocolate` area) or an `?asChocolate[=none|advance|scroll]` query param coerces any puzzle into Chocolate, swapping a variable-width encoding for 5bA1 on the way. Nothing above this layer knows which mode actually rendered, which is why the route's after-win controls are handed down as `winActions` rather than rendered by the route.

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

Two components share the same `<input type="checkbox" className="bit-checkbox">` base. Both set `data-bit-index={bit.index}` on the input, which the handlers read via `event.target.dataset.bitIndex` to identify which bit was toggled.

Bits toggle on **`pointerdown`**, not on the checkbox's `change` event (#186). Tapping two neighbouring bits quickly makes mobile Safari retarget the second tap's synthetic click onto the *first* bit, toggling it back off and leaving the second untouched — the whole gesture reads as unresponsive. `pointerdown` always carries the true target, so the toggle happens there and any `change` arriving within `SYNTHETIC_CLICK_WINDOW_MS` is dropped as that gesture's tail. The on-screen keyboards follow the same rule.
- **`BitButton`** — no `data-correctness` attribute; renders with the default (dark/black) sprites. Use when correctness is unknown or irrelevant (e.g. `DoorLock`).
- **`CorrectnessBitButton`** — requires a `correctness: Correctness` prop; sets `data-correctness` which drives CSS sprite switching (yellow = unguessed, teal = correct, purple = incorrect). Use wherever judgment feedback is shown.

### DisplayMatrix (`src/components/DisplayMatrix.tsx`)

Renders a grid of bit buttons from `DisplayRow[]`. Accepts a `renderBit: (bit: IndexedBit, rowIndex: number, indexWithinRow: number) => ReactNode` render prop — callers supply the button component and close over any click/change handlers. The inner grid div uses `className="bit-field"` (not an `id`) so multiple `DisplayMatrix` instances can coexist on the same page (e.g. DoorLock's card + staging displays). Exposes an imperative ref handle (`DisplayMatrixUpdate`) with `getWidth()`, `scrollToBottom()`, and `getBitRowElement(rowIndex)`.

### Chocolate mode (`src/components/ChocolateMode.tsx`)

The third puzzle type. The whole target text is shown, one letter per row, every bit off; the player toggles bits and a letter lights teal only once its entire row is right (`PerLetterJudge` — no bit-level feedback). Requires a fixed-width encoding and falls back to 5bA1, which `PlayPuzzle` also enforces.

Three clocks, set by `puzzle.clock`:
- **`none`** (Taste) — player-paced, no timer.
- **`advance`** (Treat) — focus hops to the next unsolved letter, timed.
- **`scroll`** (Dessert) — a conveyor carries the message up past a fixed judgment line, scoring a point or a strike per letter as it crosses. The only clock that can be *lost*, at `maxStrikes` (default 10).

**The Dessert conveyor.** The belt is one element translated every frame, and the continuous offset `s` (in rows) is the single source of truth; the discrete `judgedCount = floor(s + judgeOffset)` is derived from it, and rows are scored and locked when that integer ticks up. React stays out of the 60 fps loop — `setState` fires only when a row actually crosses. `LINE_POSITION = 0.2` puts the painted line a fifth of the way down; a row is judged when its *bottom* edge clears it, so a row still touching it is fair game. Speed rises by `scrollAccel` every `ACCEL_EVERY_ROWS` rows, and holding the cue button (or `F`/`Space`) multiplies it by `CUE_SPEED_MULTIPLIER`. The frame delta is clamped to `[0, 0.1]`: the ceiling stops a backgrounded tab leaping the belt forward on return, and the floor stops a frame timestamp that predates the effect's own `last` from driving it *backwards*.

**What sits above the message.** The runway is scaffolding — empty rows giving the first letter somewhere to ride up from — and is rendered only while the belt is moving. The clue rides the belt as prose (#231) and counts as lead-in, so the runway only makes up the difference:

```
runway = max(floor(beltRows) - 1 - clueRowCount, round(LINE_POSITION * beltRows))
```

That lands the first letter on the bottom row; a clue longer than the belt floors the runway at the judgment line, so the clue never starts flush against the top as though the belt had already run past some of it. Runway and clue rows are both pinned to exactly one row pitch in CSS, because the uniform-pitch transform model assumes every row is the same height.

**Ending a run (#227).** Three steps, in order, and the order matters:
1. **Latch the conveyor off** (`conveyorStoppedRef`) before anything else. The loop is a passive effect, so React cancels it asynchronously — a frame queued before the win can otherwise land afterwards and fight what follows.
2. **Rewind** the belt to park the clue at the top: eased, `REWIND_MS_PER_ROW` per row clamped to `[REWIND_MIN_MS, REWIND_MAX_MS]`, skipped entirely under `prefers-reduced-motion`.
3. **Hand over the view** — trade the transform for an equal `scrollTop` and drop `conveyor-locked`, so the puzzle becomes genuinely scrollable. While the belt runs it is a compositor transform inside an `overflow: hidden` box, so unlocking alone would leave the runway and clue translated out of reach rather than scrolled out of it. The rewind target is chosen so both positions are the same pixels and the swap is invisible; the runway is struck in the same commit, and the `scrollTop` is discounted by it.

The win screen waits for all of this (`winScreenReady`), so the rewind isn't covered up by a dialog.

### On-screen keyboards (`KeyboardKey.tsx`, `OnScreenKeyboard.tsx`, `BitInputs.tsx`)

`OnScreenKeyboard` is the letter keyboard for decoding; `BitInputs` is the `1`/`0`/delete/submit row for encoding. Both render `KeyboardKey`, which owns the gesture handling.

Keys press on **`pointerdown`, not `click`**, and swallow the trailing synthetic click for 700 ms — the same rule the bit grid follows (see below, #186). Keyboard activation reports `detail === 0` and has no pointerdown to pair with, so it is always honoured.

`touch-action: manipulation` belongs on **`.keyboard-key`**, not on a container. It used to sit on `.keyboard`, which `BitInputs` does not use — so the bit inputs alone kept the browser's default gesture handling, fast repeat taps on one key were evaluated as candidate double-taps and delivered bunched, and entering a long run of one bit sounded in pairs.

Not to be confused with `useActivationGuard` (`src/hooks/useActivationGuard.ts`), which solves the opposite problem: it *waits* for the click and drops it unless the gesture began on the control, for buttons that appear underneath a finger already down (#233).

### Win screen (`src/components/WinScreen.tsx`)

The post-win surface for all three puzzle modes: a native `<dialog>` opened with `showModal()`, so it sits in the browser's top layer and is not subject to `#main-display`'s overflow or the Chocolate HUD's stacking context. It takes `won` and owns its own dismissed state — showing, stepping aside ("admire puzzle"), and the `Win screen ▲` control that brings it back (`.win-screen-recall`, rendered under the puzzle while it is dismissed) are one behaviour, not the caller's business. Every route to leaving a finished puzzle lives on this screen, so dismissing it has to be a round trip. A fresh run clears the dismissal during render, because Chocolate's TRY AGAIN resets in place rather than remounting. Two slots keep mode-specific content out: `stats` (Chocolate's SCORE/GLEANED) and `actions`.

Each mode renders it as the last child of its own `#game-content`, not inside `#puzzle-inputs` — that container styles its direct children, and the recall control's `flex: 0 0 auto` is written for the outer column.

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

Most routes are gated by `useFeatureFlags()` (`src/hooks/useFeatureFlags.ts`). Flags are delivered as a signed JWT (`?features=<token>`) verified against an RSA public key embedded in the source.

The default set is `NORMAL_FEATURES = ['tutorial', 'doorLock', 'date', 'chocolate']`, so without a token you get the daily puzzle (`/today`, `/date/...`), the tutorial, Door Lock, and the whole `chocolate` group — which includes `/letErRoll` as well as `/chocolate/...`. A token is needed for `story`, `vintage`, `mall`, and `bigGameRoutes` — note that last flag is *not* named after its `/bigGame` path. `/chocolate2` is deliberately ungated as a test route.
