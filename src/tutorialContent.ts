const TUTORIAL = /tutorial/i;

/**
 * Does this puzzle belong to the tutorial?
 *
 * A deliberate hack, and worth knowing why it exists. The tutorial teaches by
 * pointing at the display — "SEE HOW THE BIT WENT FROM PURPLE TO GREEN?",
 * "DO YOU SEE THE 0 THROUGH 7 REPEATING?", and in one case a win message whose
 * entire text is "SEE?". A modal win screen covers the very thing those puzzles
 * are talking about, so tutorial content presents its win inline instead.
 *
 * Roughly fifteen puzzles genuinely need this, all of them clustered in four
 * teaching levels, but there is no field on a puzzle that marks one. Rather than
 * tag them by hand, this sweeps the whole tutorial: an over-broad rule that errs
 * towards the inline panel, which is what those puzzles shipped with anyway.
 *
 * Every candidate is checked because the word lives in different places
 * depending on where you look. It is not in the content at all in
 * docs/VintagePuzzles.json (menu "VintagePuzzles", every level slug empty, no
 * puzzle slug containing it) — there it is purely the route segment App.tsx
 * passes as menuName. A menu served from the API may well carry it in its own
 * name instead.
 *
 * Replace this with an explicit per-puzzle field when the content model can
 * carry one; the fourteen-odd puzzles that need it are listed in the #227
 * discussion.
 */
export function isTutorialContent(...candidates: (string | null | undefined)[]): boolean {
  return candidates.some(candidate => !!candidate && TUTORIAL.test(candidate));
}
