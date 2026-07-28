# MAGiE Analytics Spec

Status: draft. Bare-bones checklist — definitions get filled in when I have to look one up.

## Events

| Event           | Source        | Notes                                                  |
|-----------------|---------------|--------------------------------------------------------|
| `session_start` | GA4 automatic | Do not send. Denominator for visitor→player.           |
| `puzzle_start`  | Manual        | Puzzle screen mount **and** in-place retry. See below. |
| `puzzle_end`    | Manual        | Fired on win or loss. **Not** on abandon.              |

Abandonment is inferred: `puzzle_start` with no matching `puzzle_end`. Time-on-puzzle is inferred: timestamp delta
between the pair.

Both inferences depend on starts and ends staying paired, which is the reason `puzzle_start` can't simply
be "on mount" — see [Retry is not an outcome](#retry-is-not-an-outcome).

## Shared param block

Sent on both `puzzle_start` and `puzzle_end`.

| Param             | Example                   | Notes                                                                                         |
|-------------------|---------------------------|-----------------------------------------------------------------------------------------------|
| `menu`            | `tutorial-june2025`       | Slug, lowercase.                                                                              |
| `category`        | `decoding-letters`        | Slug, lowercase.                                                                              |
| `level`           | `first-time-alpha-length` | Slug. Denormalized — frozen at emit time.                                                     |
| `puzzle_slug`     | `1-this-is-a-bit`         | System-wide unique. Identifies the *content*.                                                 |
| `puzzle_number`   | `1`                       | Ordinal within level.                                                                         |
| `puzzle_type`     | `decode`                  | `encode` \| `decode` \| `chocolate`. As *played* — see below.                                 |
| `encoding`        | `5ba1`                    | `puzzle.encoding_name`, lowercased. Not `encoding_type` — that's inferable from the encoding. |
| `menu_position`   | `7`                       | Monotonic across whole menu. Used for "how far did they get."                                 |
| `content_version` | `2026-07-07`              | Menu `updated_at`, truncated to the date. See below.                                          |
| `attempt_number`  | `2`                       | 1-based, per puzzle, per session. See below.                                                  |

### `puzzle_type` is the played type, not the authored type

`PlayPuzzle` coerces Encode/Decode puzzles into Chocolate mode — either from the route (the `/chocolate`
area) or from an ad-hoc `?asChocolate` query param. `puzzle_type` reports what the player actually got,
so `puzzle_slug` → `puzzle_type` is **not** 1:1: the same slug can report `decode` in one area and
`chocolate` in another. That's the intended behavior for "where do they stall," but it means never treat
`puzzle_type` as a property of the puzzle.

Corollary: `?asChocolate` is a testing affordance, so it will mint real `chocolate` rows from dev
traffic. Filter dev traffic out of the reporting view, or accept the noise knowingly.

### `content_version` is derived, not curated

Take the menu's `updated_at` and truncate to the date. No separate authoring step, no discipline
required from the content pipeline.

Accepted tradeoff: a typo fix bumps the version and splits the funnel, and two deliberate revisions on
the same day collide into one version. That's the price of not maintaining it by hand, and it's the
right price for now. The `.2` suffix idea is dropped — it can't survive an auto-derived value.

Derive it by slicing the raw `updated_at` string, not by round-tripping through `Date`/`toISOString()` —
an evening edit with a non-UTC offset would otherwise land on the following day. If `updated_at` is
absent, omit the param rather than sending a placeholder.

### `menu_position` is derived from array position

Walk the menu once — categories in key order, levels in array order, puzzles in array order — and cache
the running ordinal on the `Menu` object at construction. `sort_order` is not consulted: if it's ever
missing that's a data bug, and array order is the thing the player actually experiences anyway.

Read `MAX(menu_position)` **within a single `content_version`, never across.** Inserting a puzzle
mid-tutorial shifts every position after it, so position 7 is a different puzzle before and after the
edit. That's fine, because the same edit bumps `updated_at` and therefore `content_version` — the two
move together by construction. See below; this is the general pattern, not a quirk of `menu_position`.

### `content_version` is what makes the denormalized params safe

`level`, `puzzle_type`, `menu_position` and friends are all frozen at emit time, so any of them can mean
something different after a content edit. A puzzle's type can be changed in the editor; a level can be
renamed; a puzzle can be inserted. Every one of those bumps `updated_at`.

So the rule for every funnel and every breakdown: **hold `content_version` fixed, or accept that you're
comparing across content edits.** That is the whole job this param does.

## `puzzle_end` additional param

| Param     | Values          |
|-----------|-----------------|
| `outcome` | `won` \| `lost` |

`won` and `lost` rather than `solved`/`skipped`: it matches the vocabulary already in the code
(`RunState` in `ChocolateMode`, `hasWon` throughout), which is one less translation layer to get wrong.
There is no skip affordance in the game, and navigating away is an *abandon* — inferred from a
`puzzle_start` with no `puzzle_end`, never sent.

`lost` is currently reachable only from Chocolate mode (strike-out / outrun by the conveyor). Encode and
Decode puzzles can only end `won` or be abandoned.

### Retry is not an outcome

A retry is a new attempt, so it emits a **new `puzzle_start`** — it is not an `outcome` value. The
sequence for a failed-then-won Chocolate run is:

    puzzle_start → puzzle_end(lost) → puzzle_start → puzzle_end(won)

Modeling it as `outcome: retried` would throw away the loss, which is the interesting part.

**Implementation trap:** `handleRetry` in `ChocolateMode` resets state *in place* — no remount, no route
change. So "fire `puzzle_start` on puzzle screen mount" silently misses every retry, which corrupts both
inferences at once: the second `puzzle_end` has no matching start (reads as a phantom), and the
time-on-puzzle delta spans the whole session instead of the attempt. `puzzle_start` has to fire
explicitly from the retry path as well as from mount.

### `attempt_number` counts replays, not just retries

Incremented on every `puzzle_start` and carried on the matching `puzzle_end`. Stored in **`sessionStorage`,
keyed by `puzzle_slug`** — not in a component ref.

The distinction matters, because the game has two unrelated ways to play a puzzle again:

1. **In-place retry** — Chocolate's TRY AGAIN button. Same component instance, no remount.
2. **Replay** — reload the page, or navigate away and come back. Fresh mount.

A ref only catches (1). But (2) is the *only* way to replay a daily puzzle, since dailies have no retry
button — so a ref would report `attempt_number: 1` for every daily play forever and answer the "should
dailies allow multiple attempts?" question with a flat, confident lie. `sessionStorage` catches both.

Session scope is deliberate: it resets naturally, it matches how GA4 slices things anyway, and it avoids
an unbounded set of localStorage keys growing one per puzzle ever played. Per-tab, so two tabs count
independently — acceptable.

Low-cardinality integer, so it registers cleanly as a dimension: the primary use is breaking down by it
("what share of plays are attempt 2+"), not averaging it.

## Daily puzzles

`/today` and `/date/:year/:month/:day` have no menu, category, or level. Fill the block in like this:

| Param             | Daily value  | Notes                                                       |
|-------------------|--------------|-------------------------------------------------------------|
| `menu`            | `daily`      | Sentinel.                                                   |
| `puzzle_slug`     | as normal    | Identifies the content.                                     |
| `puzzle_type`     | as normal    |                                                             |
| `puzzle_date`     | `2025-04-10` | Identifies the slot the content was served in. ISO, always. |
| `category`        | omit         |                                                             |
| `level`           | omit         |                                                             |
| `puzzle_number`   | omit         |                                                             |
| `menu_position`   | omit         |                                                             |
| `content_version` | omit         | For a daily, `puzzle_date` *is* the version.                |

`puzzle_date` is daily-only; it is not part of the shared block. It exists separately from `puzzle_slug`
because the two answer different questions: the slug is the content, the date is the slot. If a puzzle is
ever served both as a daily and inside a menu, both are needed to tell those plays apart.

**Omit means omit the key entirely** — not `""`. GA4 renders both as `(not set)`, so the empty string
buys nothing and spends a param slot.

The asymmetry is deliberate: `menu` gets a sentinel because it's the param that gets *filtered* on, and
funnel filters need it present on every event. The rest only get *broken down* by, where a `(not set)`
row is an honest answer.

## `puzzle_end` additional metric

| Param                | Notes                                                                  |
|----------------------|------------------------------------------------------------------------|
| `solve_time_seconds` | Duration of *this attempt*. Carried over from the retired `win` event. |

A custom **metric**, not a dimension — numeric, and it spends the separate 25-metric budget rather than a
dimension slot. Redundant with the inferred start/end timestamp delta, but precise, free (the stopwatch
is already running), and answerable without dropping into BigQuery.

Per *attempt*, not per screen: the stopwatch has no reset, so each attempt is measured as a delta from
wherever the previous one ended. Time spent on the game-over screen between a loss and a retry therefore
belongs to neither attempt, which is the intended reading.

## Custom dimensions to register

Register in GA4 Admin **before shipping**. No backfill.

- [ ] `menu`
- [ ] `category`
- [ ] `level`
- [ ] `puzzle_slug`
- [ ] `puzzle_number`
- [ ] `puzzle_type`
- [ ] `encoding`
- [ ] `menu_position`
- [ ] `content_version`
- [ ] `puzzle_date`
- [ ] `attempt_number`
- [ ] `outcome`

Plus one custom **metric** (separate 25-slot budget):

- [ ] `solve_time_seconds`

### What "no backfill" actually means

Registration is not retroactive. A dimension associates its parameter from the moment it is created,
forward. Events collected before that show `(not set)` under it in reports — permanently, no amount of
waiting fixes it.

But **the parameter data is collected and stored either way**. GA4 records every param sent, registered
or not; registration only controls whether it is *sliceable in the reporting UI*. Those are two separate
things, and the gap between them is what makes the workflow below possible.

So the cost of getting it wrong is not a burned slot — a dimension can be archived to reclaim one. The
cost is a permanent hole in the UI covering the window between first traffic and correct registration.
BigQuery export would rescue exactly that (raw `event_params` are all there regardless), which is worth
remembering while it stays under Deferred: until then, the GA4 UI is the only view and the hole is real.

### Verifying costs nothing

DebugView shows the full raw event payload, registered or not — that is its whole purpose. Load a puzzle
with `?_dbg`, confirm every param name and value, and no slot has been touched.

A dimension can also be created for a parameter GA4 has never seen; the form suggests recently-seen names
but doesn't restrict you to them. So registration isn't blocked on getting traffic first.

DebugView and Realtime are immediate, but standard reports lag registration by up to 24 hours — an empty
report on day one is not a bug. Sequencing is in [Before alpha testing](#before-alpha-testing).

### Debug mode is not a reporting filter

`debug_mode` routes events to DebugView. It does **not** keep them out of standard reports — debug
traffic lands in the same funnel as everything else. `VITE_GA_DEBUG=true` sitting in a dev run
configuration therefore pollutes alpha data on every local session, as does `?asChocolate` testing. The
"dev-day spikes" in the dashboard are this, not real players.

`debug_mode` and `traffic_type` are independent, and they act at different stages: `debug_mode` routes an
event into DebugView's live stream, while the Internal Traffic data filter acts at report processing. So
sending both keeps full DebugView verification *and* keeps the events out of the funnel. They are not in
tension.

## Retired

Removed when `puzzle_start`/`puzzle_end` land. Restoring any of these is a small code change, but GA4
never backfills — you'd get data from that day forward and a permanent gap behind it.

| Event              | Why                                                                                                                  |
|--------------------|----------------------------------------------------------------------------------------------------------------------|
| `guess`            | Fired on every bit toggle. Overwhelming volume, and `guess_text` is unbounded cardinality.                           |
| `winning_judgment` | Duplicate of `win` from a different layer. Folds into `puzzle_end(won)`.                                             |
| `win`              | Folds into `puzzle_end(won)`. Also suppressed on auto-win puzzles, which silently dropped the tutorial demo screens. |

If the fiddling signal is ever wanted back, prefer a `guess_count` on `puzzle_end` over restoring `guess`:
same question answered, ~1% of the volume, and it spends custom-*metric* budget (25, separate pool)
instead of a dimension slot.

## Before alpha testing

Pre-flight checklist. The order matters: steps 1–2 can't be applied retroactively, and step 4 can't be
undone.

- [ ] **1. Verify in DebugView.** Load a tutorial puzzle with `?_dbg` and read the `puzzle_start` /
      `puzzle_end` pair. Check every param name and value, and confirm an auto-win demo screen emits the
      pair in that order. Free, reversible, touches no slots — see
      [Verifying costs nothing](#verifying-costs-nothing).
- [ ] **2. Register the dimensions and the metric.** Nothing collected before this is ever sliceable.
- [ ] **3. Send `traffic_type: 'internal'` alongside `debug_mode`.** Two lines beside the existing
      `ReactGA4.initialize` call in `App.tsx`.
- [ ] **4. Switch on the Internal Traffic data filter** — Admin → Data Settings → Data Filters. Leave it
      in **Testing** mode first: testing mode excludes nothing, it just exposes a "Test data filter name"
      dimension so the match can be confirmed against real dev sessions. Only then set it Active. Active
      filtering is permanent and the excluded data is unrecoverable.
- [ ] **5. Confirm the dev-day spikes stop.** That's the signal steps 3–4 worked.
- [ ] **6. Wait 24 hours** before judging whether the standard reports look right.

Then open it up.

## Questions this should answer

- [ ] Visitor → player conversion: users with ≥1 `puzzle_start` / total users
- [ ] How far did they get: `MAX(menu_position)` per user
- [ ] Tutorial completion rate
- [ ] Where do they stall: puzzles with high start-no-end, or long time-on-puzzle
- [ ] Same funnel broken down by `content_version`
- [ ] Should dailies allow multiple attempts: distribution of `attempt_number` on daily `puzzle_start`,
      and whether `outcome: won` rate improves on attempt 2+

## Rules of thumb

- Slugs, never display names. GA4 groups on exact string.
- New param key = register a dimension. New *value* in an existing key = free.
- Param names: start with a letter, then letters/digits/underscores only. Hyphens are dropped silently at
  collection — `puzzle-date` would just vanish. snake_case everywhere, no exceptions.
- Dates as ISO `YYYY-MM-DD`. Custom dimensions are always strings, so ISO is what makes them sort
  chronologically.
- Keep `level` on the event rather than joining via Data Import — Data Import applies the *current* mapping to all
  history.
- Sending ≠ registering. Unregistered params are still collected and still land in BigQuery export; they
  just aren't sliceable in the GA4 UI. The 50-dimension cap is a *reporting* budget, so only register what
  gets used as a dimension.
- Watch cardinality before count. A dimension exceeding ~500 distinct values in a day gets bucketed into
  `(other)`. `puzzle_slug` is safe while the catalog stays small; `guess_text` never will be — don't
  register it.

## Deferred

- Self-hosted telemetry (Django + Postgres) for per-user progression
- BigQuery export
- `puzzle_version` as a second version param, once individual clues get tuned independently
- Cross-session tracking (needs accounts + consent)
- Codename: Chocolate's own metrics — strikes, points, letters survived. (`puzzle_type` already labels a
  Chocolate play; this is the run-detail layer on top.)
