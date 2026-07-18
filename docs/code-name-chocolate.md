# Spec: Codename Choclolate (New Puzzle Mode)

## Summary

A new puzzle type. Codename: Chocolate. The name comes from the episode of _I Love Lucy_ when they are working at the factory. The most-difficult sub-mode of this mode is an auto-advancing array of bits that are to be set correctly before they scroll off the screen. The full target text is **shown** to the player alongside a grid of off bits. The player toggles bits; when a letter's bits are all correct, that letter lights up teal. No clues, no blanks — this mode builds encoding fluency through reps, not recall.

## Scope

- **Fixed-width encodings only** (5bA1, hex/4-bit, 3-bit color, 2-bit suits). One row of the bit display = one letter.
- **Pre-set puzzle text only.** Any "random" content will be authored as puzzle data (e.g., random bytes rendered as hex), not generated at runtime.
- Variable-width encodings (alpha-length): explicitly out of scope for v1.

## Data model

New puzzle type: `chocolate` (A similar layout to the `EncodePuzzle` component — but do **not** branch inside EncodePuzzle.tsx).

```
{
  type: "Chocolate",
  encoding: <existing encoding ref>,
  text: "MEET ME AT THE FOUNTAIN",
  clock: "none" | "advance" | "scroll",
  scoring: "none" | "time" | "strikes",
  // scroll mode only:
  scrollSpeed: <initial>, scrollAccel: <optional ramp>,
  maxStrikes: <n>
}
```

## Judgment: new `perLetter` mode

- All-or-nothing per letter. A letter is **correct** iff every bit in its row matches; otherwise **incorrect**.
- **No per-bit feedback.** Existing judgments must not be reused here — they leak bit-level information.
- Judgment is **live**: state recomputes on every bit toggle.
- We will still use the `CorrectnessBitButton` component, but its correctness (`data-correctness`) will be tied to the correcttness of the whole letter.
- All letters start in the "incorrect" state which currently renders the bit purple; they switch teal when correct. They may switch back off if the player breaks them (zen/advance modes).

## UI: new component (`ChocolateMode`)

- `encoding.splitForDisplay(...)` will accommodate our needs. The annotation will show the letter to be encoded.
  the difference being that in the `EncodePuzzle` component, we put up the bits as the player types them on the bit buttons. In `DecodePuzzle`, we show the bits un-annotated and the player types the decoded characters on the keyboard. Here, we'll show the letter, and we'll initialize the bits to all off (which is I believe is the space (' ') character in 5bA1 encoding
- Letter tiles render lit/unlit tied to live judgment.
  This will be one change to the UI. Previously we never colored the text at all. But now we'll want to color it along with the bits, all at once (per letter) according to the `CharJudgement.isSequenceCorrect` property.
- Focus behavior per mode (below).

## Modes (same component, different clocks)

### 1. Taste (`clock: none`)
- Player-paced. Scroll/navigate freely, no scoring, no failure.
- Doubles as the low-stress option for younger players.

### 2. Treat (`clock: advance`, `scoring: time`)
- Correct letter auto-advances focus to the next row. (And scroll the display up one row as well.)
- Timer runs; score = completion time. No failure state.

### 3. Dessert (`clock: scroll`, `scoring: strikes`)
- Message auto-scrolls at `scrollSpeed`, optionally accelerating (`scrollAccel`).
- Once a letter is correct, lock the bits so the player doesn't accidentally un-set anything.
- When a letter scrolls off-screen: correct → 1 point; incorrect → 1 strike.
- `maxStrikes` strikes ends the run. This is the Flippy Bit-equivalent pressure loop.
- Future scoring enhancements (don't implement for v1, but build to easily add)
  - bonuses for fully correct words
  - bonuses for fully correct screenfuls (like, if the player "outruns" the conveyor and correctly encodes everything currently visible on the screen.)
  - bonuses for fully correct messages

## Content note

Clues, answers ("win text"), and win messages of existing encode and decode puzzles can all serve as valid chocolate text. Free content multiplier — no new authoring required to seed the mode.

## Deferred / vision (do not build)

- Runtime-random text generation.
- Variable-width encoding UI.
- **Partial-decode narrative state:** survival mode already records which letters were correct at scroll-off; a future story hook could render the "gleaned" message (`M__T ME AT TH_ F__NTAIN`) as a quest artifact. Persist nothing for now, but don't design the scoring record in a way that discards per-letter results.

## Navigation
1. We will build a new root-level route at `/chocolate` with a structure similar to the "vintage", "bigGame", and "mall" areas.
2. Wrap it in a feature block as well
3. Add that feature to the list of NORMAL_FEATURES in the `useFeatureFlags` hook.
4. Adding a third clause to the existing `PlayPuzzle` component should be a straightforward way to integrate this into the current **LevelPlay** and **DatePlay** navigation structures.
