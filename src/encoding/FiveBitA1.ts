import { BinaryEncoder } from "./BinaryEncoder.ts";
import { FixedWidthEncoder } from "./FixedWidthEncoder.ts";

const FIVE_BIT_A1_NAME = "5bA1";

// Five-bit, A=1: ' ' = 0 (all bits off), A = 1 ... Z = 26.
const fiveBitA1Map: Record<string, number> = { " ": 0 };
for (let i = 0; i < 26; i++) {
  fiveBitA1Map[String.fromCharCode(65 + i)] = i + 1;
}

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
