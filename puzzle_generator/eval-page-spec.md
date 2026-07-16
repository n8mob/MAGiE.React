# Spec: Candidate Evaluation Page (admin)

A "system" page in the magie-react app for reviewing AI-generated puzzle
candidates. Uses the site's existing UI elements and fonts, but minimal
presentation effort. Not linked from player-facing navigation — direct
route only (e.g. `/admin/evaluate`).

## Input

File input (`<input type="file" accept=".json">`) that loads the raw
output of `generate.py`. Shape:

```json
[
  {
    "winText": "MALLOWANCE",
    "type": "Encode",
    "generated_at": "2026-07-15T...",
    "model": "claude-sonnet-4-6",
    "candidates": [
      { "puzzleName": "...", "clue": ["...", "..."], "winMessage": ["..."] }
    ],
    "rejected": [ ... ]
  },
  ...
]
```

Parse in-memory (FileReader / file.text()); no upload to server.
The review unit is one **candidate** (word × candidate index), presented
one at a time in order. Ignore `rejected` entries (or show a count).

## Settings (top of page)

- **Puzzle type:** bit-button toggle. ON = Encode (default), OFF = Decode.
- **Encoding:** radio group, two options: `AlphaLengthA1`, `5bA1`.
  Style the default radio inputs to match the bit aesthetic — accent-color
  or custom styling in a distinct "admin" color, whatever is cheap.

Settings apply to how the current candidate is *previewed*; they are also
recorded with each evaluation (see output).

## Candidate display — PLAYABLE

Each candidate is mounted as a real, playable puzzle using the existing
puzzle-play components. Construct a puzzle object in the menu-JSON shape
from the candidate + current settings:

```js
{
  puzzleName, clue, winText, winMessage,
  type: settings.puzzleType,        // "Encode" | "Decode"
  encoding_name: settings.encoding, // "AlphaLengthA1" | "5bA1"
  init: ""
}
```

and hand it to the same component the game uses (whatever adapter is
needed — this page should exercise the real solving experience, including
bit entry and correctness feedback, so difficulty can actually be felt).

Admin extras around the play area:

- metadata line (small/dim): winText, candidate i of n, puzzleName, model
- **Reveal** button — shows winText without solving, for when the
  evaluator wants to bail on a candidate but still rate tone/world
- winMessage displays on solve as usual; after Reveal, show it too

Changing the type/encoding settings remounts the current candidate as a
fresh puzzle (fine to lose in-progress bits).

## Evaluation controls (bottom)

Three ratings per candidate, each 1–5 (buttons or styled radios, not
sliders):

- **Difficulty** — how hard the clue makes it to name the word
- **Tone / wording** — voice match, line breaks, caps conventions
- **World integration** — does it feel native to the mall world

Plus:

- optional freeform note (single text input)
- **Skip** button (advances without rating)
- **Next** advances after rating; auto-advance on third rating is fine but not required

Prev/Next navigation so earlier ratings can be revisited and edited.

## Output

Evaluations are written back into the in-memory object, on the candidate:

```json
{
  "puzzleName": "...",
  "clue": [...],
  "winMessage": [...],
  "evaluation": {
    "difficulty": 3,
    "tone": 5,
    "world": 4,
    "note": "",
    "puzzleType": "Encode",
    "encoding": "5bA1",
    "solved": true,
    "revealed": false,
    "evaluated_at": "ISO timestamp"
  }
}
```

Optional (only if the play components already expose it cheaply): record
objective solve stats alongside the subjective rating — guess count,
seconds to solve. Objective difficulty data will eventually beat the
1–5 gut rating, but do not build new instrumentation for v1.

```json
```

**Download** button: `JSON.stringify(data, null, 2)` → Blob → anchor
download, filename `<original-name>.evaluated.json`. Show a progress
count ("14 / 37 rated") so it's obvious when the pass is complete.

## Non-goals

- No backend/API calls, no persistence beyond the downloaded file
  (losing state on refresh is acceptable for v1)
- No editing of clue text in this page
- No auth beyond obscurity of the route
