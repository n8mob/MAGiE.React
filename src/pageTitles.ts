import { displayArea } from "./MenuNames.tsx";

/**
 * Page titles. These are display strings, not identifiers — a level can be
 * renamed and two levels in different menus can share a name, so nothing should
 * ever be keyed on one. Use `puzzle_slug` (unique) or `menu_position` (ordinal)
 * for that; see docs/magie-analytics-spec.md.
 */

const BRAND = "MAGiE";

/** What the tab says before any route has claimed a title. */
export const DEFAULT_PAGE_TITLE = BRAND;

/** Local date, not toISOString() — that would shift by the UTC offset. */
const isoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** `MAGiE 2026-07-27` */
export const dailyPuzzleTitle = (date: Date) => `${BRAND} ${isoDate(date)}`;

/** `MAGiE Tutorial` */
export const areaTitle = (menuName: string | undefined) => `${BRAND} ${displayArea(menuName)}`;

/** `MAGiE Tutorial: Decoding Letters` */
export const categoryTitle = (menuName: string | undefined, categoryName: string) =>
  `${BRAND} ${displayArea(menuName)}: ${categoryName}`;

/**
 * `MAGiE Tutorial: First Time 1/3`
 *
 * The area segment is what disambiguates levels that share a name across menus —
 * without it, "First Time" in the tutorial and in the mall collapse into one row
 * in GA4, since GA4 groups on the exact string.
 */
export const puzzleTitle = (
  menuName: string | undefined,
  levelName: string,
  puzzleNumber: number,
  puzzleCount: number,
) => `${BRAND} ${displayArea(menuName)}: ${levelName} ${puzzleNumber}/${puzzleCount}`;

/** `MAGiE Story: The Signal` */
export const storyTitle = (storyName?: string) =>
  storyName ? `${BRAND} Story: ${storyName}` : `${BRAND} Story`;

/** `MAGiE Door Lock` */
export const doorLockTitle = () => `${BRAND} Door Lock`;

/** `MAGiE: Page Not Found` */
export const notFoundTitle = () => `${BRAND}: Page Not Found`;
