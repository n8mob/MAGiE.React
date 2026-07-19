import { BinaryEncoder } from "./BinaryEncoder.ts";
import { FixedWidthEncoder } from "./FixedWidthEncoder.ts";

const FIVE_BIT_A1_NAME = "5bA1";

// Copied from docs/5bA1.json (the canonical 5bA1 data) — keep the two in sync.
// ' ' = 0 (all bits off), A = 1 ... Z = 26, then punctuation fills out the
// five-bit space. The decoding map is the exact inverse, so FixedWidthEncoder
// derives it.
const fiveBitA1Map: Record<string, number> = {
  " ": 0,
  "!": 29,
  ",": 28,
  ".": 27,
  "?": 30,
  "@": 31,
  "A": 1,
  "B": 2,
  "C": 3,
  "D": 4,
  "E": 5,
  "F": 6,
  "G": 7,
  "H": 8,
  "I": 9,
  "J": 10,
  "K": 11,
  "L": 12,
  "M": 13,
  "N": 14,
  "O": 15,
  "P": 16,
  "Q": 17,
  "R": 18,
  "S": 19,
  "T": 20,
  "U": 21,
  "V": 22,
  "W": 23,
  "X": 24,
  "Y": 25,
  "Z": 26,
};

/**
 * Built-in 5bA1 encoding, for modes that need a fixed-width encoding without
 * depending on menu data (e.g. Chocolate mode's fallback).
 */
const fiveBitA1 = new FixedWidthEncoder(5, fiveBitA1Map);

/**
 * Chocolate mode requires a fixed-width encoding (one row = one letter, and
 * PerLetterJudge assumes equal-length letters). Returns the given encoding if
 * it qualifies; a variable-width or missing encoding falls back to 5bA1.
 */
function chocolateEncoding(encoding: BinaryEncoder | undefined): BinaryEncoder {
  return encoding instanceof FixedWidthEncoder ? encoding : fiveBitA1;
}

export { fiveBitA1, chocolateEncoding, FIVE_BIT_A1_NAME };
