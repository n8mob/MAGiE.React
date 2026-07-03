# Proposal: Correctness-colored guess text

Status: **proposed** — not yet scheduled. Deliberately on hold until we decide
where this sits on the difficulty ladder (see Concerns below).

Color each character of the guess text in `GuessDisplay` according to the
correctness of its underlying guess bits. A letter that is only partially
encoded shows as "unknown" (yellow).

## What exists already

- The judges can split **by character**, not just by display row:
  `FixedWidthEncodingJudge.judgeText()` already judges with `splitByChar` as the
  splitter, producing one `CharJudgment` per character. Both encoders implement
  `splitByChar()`.
- The color semantics are established: yellow = unguessed, teal = correct,
  purple = incorrect (see [COLORS.md](../COLORS.md)), currently expressed via
  bit sprites keyed off `data-correctness`.

## The plan

### 1. Compute a per-character judgment

A memo alongside the existing row-based judgment:

```ts
charJudgments = judge.judgeBits(guessBits, winBits, bits => encoding.splitByChar(bits))
```

The existing `judgment` in `useBasePuzzle` is row-split for the bit display;
this is the same call with a different splitter. Cheapest home: `useBasePuzzle`,
exposed as `charJudgments`, memoized so decode (which might not use it at
first) doesn't pay twice.

### 2. Map each character to a `Correctness`

For character *i* of `guessText`:

- **incorrect** (purple) — its `CharJudgment` has any incorrect bit
- **correct** (teal) — all bits judged correct *and* the character's bit group
  is complete
- **unguessed** (yellow) — the trailing partially-encoded character

Partial detection differs by encoder, and this is the one genuinely fiddly bit:

- *Fixed width:* the last group is partial iff
  `guessBits.length % width !== 0`. Easy.
- *Variable width:* inherently ambiguous — a trailing run of `1`s could be "B"
  or the start of "C". The last character of a variable-width guess is *always*
  provisional until a separator bit (or more input) lands. Simplest rule: color
  the final character yellow whenever the sequence doesn't end on a confirmed
  boundary; arguably always yellow for the trailing char in variable-width
  mode.

### 3. Render colored spans in `GuessDisplay`

Props grow from `guessText: string` to also accept optional
`charCorrectness?: Correctness[]` (parallel array).

- When present: render one `<span data-correctness={...}>` per character
  instead of a single text node.
- When absent: current single-span behavior — consumers that don't opt in are
  unaffected. This also enables shipping the feature per-puzzle or
  per-difficulty rather than always-on.

### 4. CSS

Three color rules keyed on `data-correctness`, e.g.

```css
.guess-text [data-correctness="correct"] { color: var(--bit-teal); }
```

The sprite colors exist as PNGs but not yet as CSS variables — this feature
wants the three hues added to `:root` (small COLORS.md addendum). Text color
may want slightly darkened variants for contrast against the display
background.

## Effort

Small: ~30 lines in the hook/component, 3 CSS rules, plus unit tests for the
char-mapping function (the partial-character logic is the only part worth
testing, and it's pure).

## Concerns to weigh before committing

1. **It leaks information.** Per-character coloring tells the player *which*
   letter is wrong — significantly stronger feedback than the bit-level
   sprites, since it does the "which character does this wrong bit belong to?"
   work for them. That's a real difficulty reduction. Like the
   live-judging-vs-submit-to-judge distinction, this could be a per-puzzle or
   per-difficulty flag rather than always-on.
2. **Variable-width ambiguity** (above) means the trailing character's color
   will flicker yellow→teal as separators land. Fine once understood, but might
   read as "glitchy" to a new player.
3. **Interaction with `hidden`.** `Correctness.hidden` exists for bits beyond
   the judged region; the mapping should treat any char containing only hidden
   bits as uncolored/default rather than yellow, or the whole tail lights up.

## Summary

Mechanically cheap, but it's a hint system wearing a styling costume — hold it
until it has a place on the difficulty ladder. Making `charCorrectness`
optional in `GuessDisplay` from day one means it can ship on tutorial puzzles
only and leave harder modes monochrome.
