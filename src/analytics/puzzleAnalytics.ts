import ReactGA4 from "react-ga4";
import { Menu, Puzzle } from "../model.ts";

/**
 * The puzzle funnel events from docs/magie-analytics-spec.md.
 *
 * Two events, `puzzle_start` and `puzzle_end`, carrying a shared param block.
 * Abandonment is inferred (a start with no end) and time-on-puzzle is inferred
 * (the delta between the pair), so both inferences depend on starts and ends
 * staying paired — see `trackPuzzleStart` for why that isn't just "on mount".
 */

/** GA4 groups on the exact string, so every value is a slug. */
const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * The menu's `updated_at`, truncated to the date.
 *
 * Sliced off the raw string rather than round-tripped through Date/toISOString:
 * an evening edit at a non-UTC offset would otherwise be reported as the
 * following day.
 */
const contentVersion = (updatedAt?: string): string | undefined =>
  /^\d{4}-\d{2}-\d{2}/.exec(updatedAt ?? "")?.[0];

/** Local date as ISO. Not toISOString(), which would shift by the UTC offset. */
const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * Where a puzzle sits in the content. Everything the route knows before the
 * puzzle is actually handed to a play mode.
 */
export interface PuzzlePlacement {
  menu: string;
  category?: string;
  level?: string;
  puzzle_slug: string;
  puzzle_number?: number;
  menu_position?: number;
  content_version?: string;
  puzzle_date?: string;
}

/**
 * Placement plus what the player actually got.
 *
 * `puzzle_type` and `encoding` are split out from `PuzzlePlacement` on purpose:
 * PlayPuzzle can coerce a Decode puzzle into Chocolate mode (and swap its
 * encoding to 5bA1 doing it), so neither is knowable from the route. They must
 * be resolved from the puzzle as played — see `resolvePuzzleContext`.
 */
export type PuzzleAnalyticsContext = PuzzlePlacement & {
  puzzle_type: string;
  encoding?: string;
};

/** Placement for a puzzle reached through a menu. */
export function menuPlacement(
  menu: Menu,
  category: { name: string } | null | undefined,
  level: { levelName: string[] } | null | undefined,
  puzzle: Puzzle,
  puzzleIndex: number,
): PuzzlePlacement {
  return {
    // The menu's own name, not the route segment: MENU_NAME_MAP aliases
    // /chocolate onto the mall's menu, so the route would mislabel the content.
    menu: slugify(menu.name),
    category: category?.name ? slugify(category.name) : undefined,
    level: level?.levelName?.length ? slugify(level.levelName.join(" ")) : undefined,
    puzzle_slug: puzzle.slug,
    puzzle_number: puzzleIndex + 1, // 1-based, to match menu_position
    menu_position: menu.menuPositions[puzzle.slug],
    content_version: contentVersion(menu.updated_at),
  };
}

/**
 * Placement for a daily puzzle.
 *
 * Dailies have no menu, category, or level. `menu` still gets a sentinel because
 * it's the param that our funnels will  filter on;
 * the rest are omitted, where a `(not set)` row is an honest answer.
 * `content_version` is omitted too — for a daily,
 * `puzzle_date` is the version.
 */
export function dailyPlacement(puzzle: Puzzle, date: Date): PuzzlePlacement {
  return {
    menu: "daily",
    puzzle_slug: puzzle.slug,
    puzzle_date: isoDate(date),
  };
}

/** Fold in the type and encoding the player actually got. */
export function resolvePuzzleContext(
  placement: PuzzlePlacement,
  puzzle: Puzzle,
): PuzzleAnalyticsContext {
  return {
    ...placement,
    puzzle_type: slugify(puzzle.type),
    encoding: puzzle.encoding_name ? slugify(puzzle.encoding_name) : undefined,
  };
}

/*
 * attempt_number lives in sessionStorage rather than a ref because the game has
 * two unrelated ways to replay a puzzle: Chocolate's in-place TRY AGAIN (same
 * component instance) and a plain reload or navigate-away-and-back (fresh
 * mount). A ref only sees the first, and the second is the *only* way to replay
 * a daily — so a ref would report attempt 1 for every daily play forever.
 *
 * Session scope resets naturally and avoids an unbounded pile of localStorage
 * keys, one per puzzle ever played. Per-tab, so two tabs count independently.
 */
const attemptKey = (puzzleSlug: string) => `magie:attempt:${puzzleSlug}`;

const readAttempt = (puzzleSlug: string): number => {
  try {
    const stored = parseInt(sessionStorage.getItem(attemptKey(puzzleSlug)) ?? "", 10);
    return Number.isFinite(stored) && stored > 0 ? stored : 0;
  } catch {
    // Private browsing modes can throw on sessionStorage access.
    return 0;
  }
};

const startAttempt = (puzzleSlug: string): number => {
  const next = readAttempt(puzzleSlug) + 1;
  try {
    sessionStorage.setItem(attemptKey(puzzleSlug), String(next));
  } catch {
    // Storage unavailable: every attempt reports as 1 rather than failing.
  }
  return next;
};

/**
 * Drop empty params instead of sending "".
 *
 * GA4 renders a missing key and an empty string identically as `(not set)`, so
 * the empty string buys nothing and spends one of the 25 params per event.
 */
const sent = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

/**
 * Fire on puzzle screen mount *and* on in-place retry.
 *
 * The retry half matters: ChocolateMode's handleRetry resets state without
 * remounting, so a mount-only start would leave the second puzzle_end of a
 * retried run with no matching start — which reads as a phantom end and stretches
 * time-on-puzzle across the whole session instead of the attempt.
 */
export function trackPuzzleStart(context: PuzzleAnalyticsContext) {
  ReactGA4.event("puzzle_start", sent({
    ...context,
    attempt_number: startAttempt(context.puzzle_slug),
  }));
}

/**
 * Fire on win or loss. Never on abandon — that's inferred from a start with no end.
 *
 * `solve_time_seconds` is the duration of *this attempt*, and is a custom metric
 * rather than a dimension. It carries over from the retired `win` event: the
 * spec's inferred time-on-puzzle (the start/end timestamp delta) answers the same
 * question, but only in BigQuery or an exploration, and only to session
 * granularity.
 */
export function trackPuzzleEnd(
  context: PuzzleAnalyticsContext,
  outcome: "won" | "lost",
  solveTimeSeconds?: number,
) {
  ReactGA4.event("puzzle_end", sent({
    ...context,
    attempt_number: Math.max(readAttempt(context.puzzle_slug), 1),
    outcome,
    solve_time_seconds: solveTimeSeconds,
  }));
}
