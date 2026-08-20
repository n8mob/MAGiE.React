# Proposal: Device setup (player registration)

Status: **proposed** — design only, nothing built. The "hello world" of
player-authored input: the player types a value we do not know in advance,
instead of reproducing one the puzzle already holds.

In fiction: a student switching on her MAGiE for the first time is expected to
set it up. She enters her name the only way the device accepts input — one bit
at a time. That gives us a profile, and gives every later message someone to
address.

Scope here is **that screen and nothing else**. The general "answer a question"
primitive is deliberately left for later; the last section marks the seam where
it would attach.

## What exists already

Most of this is built. The interesting finding of this survey is how little is
actually new.

- **DoorLock is the precedent for input without an authored answer.** It runs a
  two-stage model — `stagingBits` (live, editable, per-bit toggleable) committed
  to `cardBits` on Enter — and it never touches `BinaryJudge` at all; it compares
  two integers inline. Setup is DoorLock's input model with a different ending.
- **Bits with no correctness already render.** `BitButton` (as opposed to
  `CorrectnessBitButton`) omits `data-correctness` and draws the default dark
  sprites. AGENTS.md already states the rule: use it "when correctness is unknown
  or irrelevant (e.g. `DoorLock`)". Setup is exactly that case.
- **`BitInputs` already has a submit key**, wired to an `onSubmit` prop that
  `EncodePuzzle` passes as a no-op (`onSubmit={() => {}}`) and DoorLock uses for
  real. Nothing new is needed to commit a field.
- **`GuessDisplay`** is already the "what you've entered so far" readout, with
  tail-pinned overflow and a blinking cursor.
- **First-run and settings surfaces exist.** `App.tsx` gates a `WelcomeContent`
  dialog on `localStorage.getItem('isFirstVisit') === null`, and
  `SettingsContent` already persists a preference to `localStorage`.
- **No profile concept exists anywhere.** Grepping `profile|playerName|userName`
  across `src/` returns nothing. This is greenfield.

### Two encoding facts that shape the design

Both verified against the encoder, not assumed:

1. **5bA1 is total.** All 32 five-bit values are mapped: `0` = space, 1–26 =
   A–Z, 27 = `.`, 28 = `,`, 29 = `!`, 30 = `?`, 31 = `@`. So **there is no such
   thing as an invalid bit pattern in 5bA1** — the `defaultDecoded = '?'`
   fallback in `FixedWidthEncoder` never fires here. Validation cannot be "is
   this decodable"; it has to be semantic. (The fallback *would* matter if setup
   were ever offered in a partial encoding such as hex, which covers only 0–9 and
   A–F.)

2. **A half-typed character decodes as a whole one.** `decodeText` slices in
   fixed `width` chunks and `parseInt`s whatever it finds, so a trailing partial
   chunk is silently treated as left-zero-padded. Typing `M` (`01101`) one bit at
   a time, the readout reads:

   ```
       0 -> " "
      01 -> "A"
     011 -> "C"
    0110 -> "F"
   01101 -> "M"
   ```

   And `HI` plus two stray bits reads `"HIA"` — a spurious third letter. On a
   puzzle this is harmless churn. On a form whose value is **persisted and shown
   back for months**, it is a trap: the name can look finished when it is one bit
   short. This is the single most important constraint below.

## The shape of the problem

Every existing mode judges by **equality against an authored `winText`**.
Registration has no authored answer, so there is nothing to compare against.

The replacement is not a weaker judgment — it is a different kind:

|                             | judged by                             | source of truth       |
|-----------------------------|---------------------------------------|-----------------------|
| Encode / Decode / Chocolate | equality: `guessBits === winBits`     | puzzle content        |
| Door Lock                   | equality against a generated sequence | runtime RNG / presets |
| **Device setup**            | **a predicate over the decoded text** | **the player**        |

That framing is the whole design. "Is this an acceptable name?" is a predicate;
"does this equal `winText`?" is just the special case the game happens to have
started with. Everything below is a predicate over decoded text, and nothing
below needs the judgment pipeline.

## The plan

### 1. A route, not a puzzle type

Add `/setup` as its own route with a `setup` feature flag while in development.

Resist making it a `Puzzle` with `type: "Setup"`. `Puzzle` currently declares
`init: string` and `winText: string` as **required**, and both are load-bearing:
`useBasePuzzle` derives `winBits` from `winText`, `isAutoWinPuzzle` compares the
two, and all four judges plus `PerLetterJudge` assume a win sequence exists.
Making them optional to accommodate one screen would ripple through every mode
for no gain. Setup is a fixed app flow, not authored content.

### 2. Profile storage

One namespaced key, storing **decoded text rather than bits** so the profile
survives an encoding change:

```ts
// localStorage["magie.profile"]
{ "version": 1, "name": "MAGGIE", "registeredAt": "2026-08-19" }
```

Namespacing matters more than usual here: `PuzzleApi` currently uses **raw menu
names as localStorage keys** (`localStorage.getItem(menuName)`), so the
unprefixed keyspace is already shared with content. Wrap access in a tiny
`profile.ts` (`readProfile()` / `writeProfile()` / `clearProfile()`) — a single
seam, easy to stub in tests, and the natural home for the `version` migration
when a second field arrives.

Normalize on commit: uppercase, trim, collapse internal runs of spaces. 5bA1 has
no lowercase and `#root` sets `text-transform: uppercase`, so a stored
lowercase name would be a lie the display quietly covers up.

### 3. The screen

Reuse the DoorLock arrangement:

1. **Staging grid** — `DisplayMatrix` + `BitButton`, per-bit toggle, delete
   removes the last bit. No correctness sprites; there is nothing to be right or
   wrong about yet.
2. **Readout** — `GuessDisplay`-style live decode, with the fix from step 4.
3. **Encoding key** — a reference card (`A=1 … Z=26`). See Concerns: without
   this the screen is a wall for the player it is aimed at.
4. **Submit** → confirm step (`IS THIS RIGHT? [YES] [FIX]`) → write profile.

The confirm step earns its keystroke: this value persists and reappears in
messages later, so committing it should be deliberate rather than a side effect
of the last bit landing.

### 4. Separate the complete characters from the tail

The one piece of genuinely new logic, and it is pure:

```ts
// bits -> { text, partialBits }
const complete = bits.length - (bits.length % width);
const text = encoding.decodeText(bits.slice(0, complete));
const partialBits = bits.slice(complete);   // 0..width-1 bits, not yet a letter
```

Render `text` as the name and `partialBits` as a distinct in-progress run (a
dimmed cursor block, say) so the player can always see they are mid-character.
Only `text` is ever validated or committed.

Worth a unit test on its own — it is the part that would silently persist a
wrong name, and it is a pure function of `(bits, width)`.

### 5. Validation predicate

Given 5bA1's totality, the rules are semantic and short:

- at least one letter A–Z (so `!!!` and a lone space are rejected)
- 1–12 characters after trimming (long enough for a name, short enough for a
  message line and the display width)
- no trailing partial character (step 4)

One pure function, `validateName(text): { ok: true } | { ok: false, reason }`,
with the reason rendered in the device's voice — `NAME TOO LONG`, `NEEDS A
LETTER`.

### 6. Personalization

Once a name exists, message lines can address the player. Keep it to one seam: a
pure `personalize(line, profile)` applied where clue/`winMessage` lines are
rendered, with a graceful fallback so unset profiles read sensibly.

```
"HELLO {NAME}!"  ->  "HELLO MAGGIE!"   (set)
                 ->  "HELLO STUDENT!"  (unset)
```

Doing it at render rather than at load means a name changed in Settings takes
effect everywhere without cache invalidation. Note this touches Encode, Decode,
Chocolate and `WinScreen` — which is precisely the argument for it being *one*
function rather than four sprinklings of string replacement.

## Effort

Small, and unusually well isolated. One route, one component (structurally a
simplified DoorLock), one storage module, two pure functions with tests. No
model changes, no judgment changes, no API changes, no migration.

The personalization step (6) is the only part that reaches into existing render
paths, and it is one function call in each of four places.

## Concerns to weigh before committing

1. **Sequencing — the real risk.** Setting up the device is thematically a
   first-launch act, but at first launch the player does not yet know the
   encoding, and the only input method is binary. A 6-letter name is 30
   deliberate bit taps with no idea which ones. Mitigations, in preference
   order:
   - **Ship the encoding key on the screen** (step 3.3). In-universe a new
     device comes with a reference card, so this is characterful rather than a
     concession — and it is what makes first-launch setup viable at all.
   - Make it **skippable** (`SET UP LATER`), defaulting to `STUDENT`, reachable
     again from Settings.
   - Or place it at the end of the first tutorial level, once A–Z has been
     taught. Loses the switch-it-on-and-set-it-up beat; worth it if playtesting
     shows the key is not enough.

2. **Typing cost scales brutally.** Every field is `5 × letters` taps. `MAGGIE`
   is 30; a second field of similar length makes it 60. Recommend **exactly one
   typed field for v1**. If a second value is wanted, have the device *assign*
   it (a serial number it displays rather than asks for) — free personalization,
   zero taps, and very much in the voice of the fiction.

3. **The name becomes a content dependency.** Once messages interpolate it,
   every puzzle's text depends on profile state. The fallback in step 6 is what
   keeps an unset or cleared profile from rendering `HELLO {NAME}!` at a player.
   Worth a test that renders a message with no profile.

4. **It is a form, so it needs an edit path.** Names get typo'd and persisted.
   Settings should be able to re-enter setup and clear the profile. Cheap if
   `/setup` is a real route from the start (step 1) — expensive to retrofit if
   it is a dialog buried in first-run.

5. **Punctuation is legal and probably charming.** `MAGGIE!` and `M@GGIE`
   encode fine in 5bA1. Allowing the full character set costs nothing and gives
   players a small toy; the "at least one letter" rule is what keeps it from
   becoming a garbage field.

## The seam for later

When free-answer *puzzles* arrive, the generalization is already implied above:
a puzzle judged by a **predicate over its decoded value** rather than equality
against `winText`. `validateName` is one such predicate; `isPrime`,
`startsWith("M")`, `answersTheRiddle` are others.

The way in is a judge alongside the existing four rather than a change to them —
existing content keeps its equality judgment untouched, and equality becomes one
predicate among several rather than the only shape an answer can have. Nothing
in this proposal needs to anticipate that beyond keeping the validation logic a
pure function of decoded text, which step 5 does anyway.

## Summary

Cheaper than it looks, because DoorLock already solved the input half and
`BitButton` already solved the rendering half. The genuinely new work is a
storage module and two pure functions.

The one non-obvious hazard is the partial trailing character (step 4): on a
puzzle it is harmless churn, but on a value that persists and gets shown back
for months, it will silently store a name that is one bit short of what the
player meant.

The one design risk is sequencing (Concern 1) — and shipping the encoding key
on the screen turns that from a wall into a piece of world-building.
