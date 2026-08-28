# Chocolate Mode — Tutorial Puzzle Sequence
(By Claude.ai)

**Principle:** Don't teach the lessons — build puzzles where each lesson is the only way out.
5bA1 is never a lesson; it's ambient (the sticky note). The judged-edge merges into the
conveyor lesson, since they only make sense together.

## P1 — "A" (Taste mode, one letter)

- **Teaches:** toggle a bit; teal = correct.
- A = `00001`, so the very first tap wins. Fastest possible first dopamine hit.
- The 5bA1 "overview" is just the sticky note sitting there. No prose lesson.

## P2 — Short word (Taste mode)

- **Teaches:** reading the sticky note for a *sum* letter; winChar-left / currentChar-right layout.
- Pick a word with one landmark letter (A, B, D, H, P) and one sum letter — e.g. "HI".
- Optional: include a space to demo the free-pass `00000` ("HI MOM"?).

## P3 — Dessert mode, belt crawling

- **Teaches:** the belt, the judged-edge, *and* fast-forward — via one dirty trick.
- Belt is set **very slow**. A player fresh off P1–P2 finishes every row long before it
  reaches the edge. Bored, watching correct teal rows creep toward a line... and there's
  a ⏩ button. **Boredom teaches fast-forward better than any tooltip.**
- The edge teaches itself the first time a row visibly crosses and locks.
- Possible affordance: if player idles with all visible rows correct, ⏩ does a little
  wiggle (cousin of the sticky-note flutter logic).

## P4 — Dessert mode, real speed, strikes

- **Teaches:** consequences.
- Tune so a miss is *likely but survivable* — a longer word where one row plausibly
  slips across the edge wrong.
- First strike lands → nothing terrible happens → counter appears. Player learns strikes
  exist and one isn't death.
- Ends at the ▶ (more tutorials) / ⏩ (today's puzzle) fork.

## Open design work

- **P3 belt speed** is the only real tuning problem: slow enough to provoke ⏩,
  not so slow that a player who never finds ⏩ rage-quits.
- P4 word choice: long enough that one slip is probable, short enough to stay friendly.
