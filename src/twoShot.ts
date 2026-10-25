import { isAutoWinPuzzle, Puzzle } from "./model.ts";

// First-draft copy for the generated decode shot.
const DECODE_SHOT_CLUE = ["decode the bits"];
const DECODE_SHOT_WIN_MESSAGE = ["Good.", "Now", "encode a response."];

// What DecodePuzzle's keyboard can type. A clue with anything else (the
// tutorial's "1 = ON" style digits, say) would make an unwinnable decode shot.
const DECODABLE_TEXT = /^[A-Z,.!? ]+$/;

export interface TwoShots {
  /** Decode the original clue. Null when the clue can't make a fair decode shot. */
  decodeShot: Puzzle | null;
  /** Encode the original answer, with the clue the player just decoded. */
  finalShot: Puzzle;
}

/**
 * Splits one Encode/Decode puzzle into the two shots the twoShot experiment
 * plays back to back. Auto-win puzzles are demo screens with nothing to decode,
 * so they pass through untouched.
 */
export const splitIntoShots = (puzzle: Puzzle): TwoShots => {
  if (isAutoWinPuzzle(puzzle)) {
    return { decodeShot: null, finalShot: puzzle };
  }

  const finalShot: Puzzle = { ...puzzle, type: "Encode" };
  const clueText = (puzzle.clue ?? []).join(" ").replace(/\s+/g, " ").trim().toUpperCase();
  if (!DECODABLE_TEXT.test(clueText)) {
    return { decodeShot: null, finalShot };
  }

  const decodeShot: Puzzle = {
    ...puzzle,
    slug: `${puzzle.slug}-decode`,
    type: "Decode",
    init: "",
    clue: DECODE_SHOT_CLUE,
    winText: clueText,
    winMessage: DECODE_SHOT_WIN_MESSAGE,
  };
  return { decodeShot, finalShot };
};
