import IndexedBit from "./IndexedBit.ts";

type BitString = `${"0" | "1"}`;

/**
 * Represents a sequence of bits. Most likely a sub-sequence of bits.
 * Like a display row or the bits of a single letter within a larger text string.
 */
class BitSequence {
  private bits: IndexedBit[] = [];

  private static stripNonBits(s: string): BitString {
    return s.replace(/[^01]/g, "") as BitString;
  }

  private constructor(bits: IndexedBit[]) {
    this.bits = bits;
  }

  toString(): string {
    return this.bits.map(bit => bit.toString()).join("");
  }

  /**
   * "Sanitizes" the string by removing all non-bit characters,
   * then returns it as a sequence of IndexedBits.
   *
   * @param s The string to convert.
   *
   * It is expected to be only "1"s and "0"s, any other non-bit characters will be removed.
   *
   * @param startIndex The index to start from. Defaults to 0.
   * For example, if this was the encoding of the third letter in a word,
   * and your encoding was, say, 5 bits per letter,
   * Then the bit indices for the first letter would be 0-4,
   * the second letter would be 5-9,
   * and this, the third letter, would be 10-14.
   *
   * @example 1: removing non-bits
   * ```TypeScript
   * const sequence = BitSequence.fromString("1a0b1c0");
   * // sequence.toString() === "1010"
   * // sequence.bits[0].index === 0
   * // sequence.bits[1].index === 1
   * // etc.
   * ```
   *
   * @example 2: using startIndex
   * ```TypeScript
   * const sequence = BitSequence.fromString("00101", 5);
   * // sequence.toString() === "00101"
   * // sequence.bits[0].index === 5
   * // sequence.bits[1].index === 6
   * // etc.
   */
  static fromString(s: string, startIndex: number = 0): BitSequence {
    return BitSequence.fromBitString(BitSequence.stripNonBits(s), startIndex);
  }

  static fromBitString(bits: BitString, startIndex: number = 0): BitSequence {
    const indexedBits: IndexedBit[] = [];
    for (const [index, bit] of [...bits].entries()) {
      indexedBits.push(new IndexedBit(bit as "0" | "1", index + startIndex));
    }
    return new BitSequence(indexedBits);
  }
}

export default BitSequence;
export { toBitString, stripNonBits };
export type { BitString };