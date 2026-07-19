# Spec: Codename Chocolate (New Puzzle Mode)

## Summary

A new puzzle type. Codename: Chocolate. The name comes from the episode of _I Love Lucy_ when they are working at the factory. The most-difficult sub-mode of this mode is an auto-advancing array of bits that are to be set correctly before they scroll off the screen. The full target text is **shown** to the player alongside a grid of off bits. The player toggles bits; when a letter's bits are all correct, that letter lights up teal. No clues, no blanks — this mode builds encoding fluency through reps, not recall.

## Status

**v1 implemented** (2026-07-17, branch `code-name-chocolate`):

- `src/judgment/PerLetterJudge.ts` (+ tests in `src/test/judgment/PerLetterJudge.test.ts`)
- `src/components/ChocolateMode.tsx` + `Chocolate.css`
- `Puzzle` model fields in `src/model.ts`; third clause + override in `PlayPuzzle.tsx`
- `/chocolate` routes in `App.tsx`; `chocolate` in `NORMAL_FEATURES`

Known loose ends: the `scoring` array is modeled but not yet consulted (strikes are
inherent to scroll mode); TRY AGAIN doesn't reset the header stopwatch; the
annotation text colors in `Chocolate.css` are approximations of the sprite
teal/purple; the `chocolate` entry in `MENU_NAME_MAP` still shows the mall's title.

## Scope

- **Fixed-width encodings only** (5bA1, hex/4-bit, 3-bit color, 2-bit suits). One row of the bit display = one letter.
- **Pre-set puzzle text only.** Any "random" content will be authored as puzzle data (e.g., random bytes rendered as hex), not generated at runtime.
- Variable-width encodings (alpha-length): explicitly out of scope for v1.
  - **Decision:** a puzzle whose encoding is variable-width (or missing) is played with a built-in client-side **5bA1** encoding instead (`' '` = 0, A = 1 … Z = 26; `src/encoding/FiveBitA1.ts`). The substitution happens in `PlayPuzzle` (so `encoding_name` and analytics report `5bA1`), and `ChocolateMode` re-resolves defensively via the same `chocolateEncoding()` helper.

## Data model

New puzzle type: `"Chocolate"` (a similar layout to the `EncodePuzzle` component — but it does **not** branch inside EncodePuzzle.tsx; it's a separate `ChocolateMode` component).

**Decision:** reuse `winText` (not a new `text` field) so every existing puzzle is valid chocolate content with zero mapping.

```
{
  type: "Chocolate",
  encoding: <existing encoding ref>,
  winText: "MEET ME AT THE FOUNTAIN",
  clue: [...],        // optional; concatenated ahead of winText as conveyor text
  winMessage: [...],  // optional; shown as text (no bits) after the win, with the ta-da
  clock: "none" | "advance" | "scroll",   // default: "scroll"
  scoring: ("time" | "strikes")[],        // default: ["time", "strikes"]
  scrollSpeed: <rows per second>,         // default: 0.15 (playtested down from 0.8)
  scrollAccel: <rows/sec added every 10 scrolled rows>,  // default: 0.05
  maxStrikes: <n>                         // default: 3? 5? 10?
}
```

All chocolate-specific fields are optional with the defaults above, so an untouched
Encode/Decode puzzle forced into Chocolate mode plays as Dessert.

**Conveyor text** = clue lines + winText, joined with spaces, whitespace-collapsed,
uppercased.

**Scroll semantics (decision):** `scrollSpeed` is rows per second, advanced in
**discrete whole-row steps** (one step every `1/speed` seconds — retro feel, no
smooth scrolling). The row leaving the top edge is judged at the moment of the
step. `scrollAccel` is added to the speed every 10 scrolled rows.

## Judgment: `PerLetterJudge`

- All-or-nothing per letter. A letter is **correct** iff every bit in its row matches; otherwise **incorrect**.
- **No per-bit feedback.** Existing judgments are not reused — they leak bit-level information. Every bit in a letter carries the whole letter's correctness.
- Judgment is **live**: recomputed on every bit toggle.
- Uses the existing `CorrectnessBitButton`; its `data-correctness` is tied to the whole letter.
- All letters start "incorrect" (purple); they switch teal when correct. They may switch back if the player breaks them (Taste/Treat).
- **Spaces are instant freebies (decision):** all-bits-off is the space character, so space rows start teal, auto-advance in Treat, and score free points in Dessert. Same applies to any character the encoding maps to zero. Adjust later if too easy.

## UI: `ChocolateMode` component

- One `DisplayRow` per letter (built from `encoding.splitByChar`), annotated with the **target** letter to be encoded. Bits initialize to all off.
- Letter annotations color teal/purple together with their bits, per `isSequenceCorrect`, via a new optional `rowClassName` prop on `DisplayMatrix` (CSS in `Chocolate.css`; the bits themselves still use the sprite swaps).
- **Input model (decision): type + tap.**
  - `0`/`1` keys and the on-screen `BitInputs` buttons fill from the cursor; typing `0` just steps past an off bit.
  - Backspace steps back and clears.
  - Tapping any bit toggles it and moves the cursor there.
  - Arrow keys navigate (left/right one bit, up/down one row).
- Focused row gets a background tint; it's stepped (not smoothly scrolled) into view.

## Modes (same component, different clocks)

**Starting position (decision):** the first letter starts at the **bottom** of the
display in Dessert (a measured screenful of empty conveyor belt leads in and
scrolls off unjudged, so the player has the full belt-travel time on letter one),
**half-way up** in Treat, and at the **top** in Taste. Implemented as spacer rows
sized from the display height at run start.

### 1. Taste (`clock: none`)
- Player-paced. Navigate freely, no scoring, no failure. The cursor just flows; nothing auto-advances, and completed letters can be broken and re-fixed.
- Doubles as the low-stress option for younger players.

### 2. Treat (`clock: advance`, timed)
- When the focused letter goes correct, the cursor snaps to the **next not-yet-correct row** (which auto-skips the free space rows) and the display steps to keep it in view.
- Breaking an earlier letter: focus follows taps, so tapping the broken row moves the cursor there. No automatic jump-back.
- Timer runs (the existing `PlayPuzzle` stopwatch); score = completion time. No failure state.

### 3. Dessert (`clock: scroll`, strikes)
- **Rows persist (decision):** nothing is removed from the screen. A **judged edge** sweeps down the message one row per tick at `scrollSpeed`, accelerating by `scrollAccel` every 10 rows. Judged rows stay visible but immutable — the player can scroll back over them for reference.
- A **status gutter** column sits left of the bits (fixed width, keeps bit columns even). The gutter shows `🞂` on the next row to be judged; if the player has scrolled ahead and the judged edge is above the viewport, the top visible row shows `🞁` instead, flipping back to `🞂` when the edge catches up.
- Once a letter is correct, its bits **lock** immediately (unchanged); the cursor skips locked rows. All judged rows are immutable regardless of correctness.
- When the edge passes a letter: correct → 1 point; incorrect → 1 strike. HUD (sticky) shows `SCORE` and `STRIKES n/max`.
- **Auto-scroll (decision):** a **scroll edge** trails the judged edge by ~70% of the visible row count, capped at 7 rows. When the scroll edge would pass the bottom of the viewport, the view steps down — at most one row per tick. Consequences: a player who scrolls *ahead* is left in peace until the edge catches up (view never yanked); a player who scrolls *back* over judged rows is tugged gently toward the action, one row per tick.
- The view auto-follows the cursor only on player input (typing, tapping, arrows), never on belt ticks.
- `maxStrikes` ends the run: score screen (points, letters gleaned) with a TRY AGAIN button that resets the run. A `chocolate_strike_out` GA event fires.
- **Run endings (decision):** surviving the whole message — or completing every letter early ("outrunning the conveyor", which banks the untouched remainder as points) — triggers the standard win flow (ta-da, win message, share) plus the point total.
- Per-letter results are recorded as a full boolean array per run (see Deferred), not collapsed to a count.
- Future scoring enhancements (not in v1, but the structure allows them):
  - bonuses for fully correct words
  - bonuses for fully correct screenfuls
  - bonuses for fully correct messages

## Content note

**Decision:** for an existing Encode/Decode puzzle played as Chocolate, the conveyor
text is **clue + winText** concatenated (the same rule applies if a real
`"Chocolate"` puzzle ships clue lines). `winMessage` lines keep their normal role:
shown as text after the win. Free content multiplier — no new authoring required to
seed the mode.

## Deferred / vision (do not build)

- Runtime-random text generation.
- Variable-width encoding UI.
- **Partial-decode narrative state:** survival mode already records which letters were correct at scroll-off (the `letterResults` boolean array in `ChocolateMode`); a future story hook could render the "gleaned" message (`M__T ME AT TH_ F__NTAIN`) as a quest artifact. Nothing is persisted for now, but the per-letter results are never discarded mid-run.

## Navigation (as built)

1. Root-level `/chocolate` area with the same MenuBrowser → CategoryBrowser → LevelBrowser → LevelPlay structure as vintage/mall/bigGame.
2. All four routes pass `menuName="chocolate"`; `MENU_NAME_MAP` aliases that key to the mall's API menu (`AbandonedMall-March2025`), so the area browses mall content while links stay under `/chocolate/...`. Swap the alias (or add a real chocolate menu) server-side without touching routes.
3. Gated by the `chocolate` feature flag, which is in `NORMAL_FEATURES` (on by default).
4. `PlayPuzzle` has a third clause for `type === "Chocolate"`, and two ways to force the mode on a non-Chocolate puzzle:
   - `asChocolate` prop (threaded through `LevelPlay`; set on the `/chocolate` play route). Kept out of `MENU_NAME_MAP` on purpose — that map stays naming/presentation data.
   - `?asChocolate` query param on any puzzle URL, for ad-hoc testing. An optional value picks the clock: `?asChocolate=none|advance|scroll`.
