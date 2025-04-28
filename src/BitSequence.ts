import { IndexedBit } from "./IndexedBit.ts";

/**
 * Represents a sequence of bits. Most likely a sub-sequence of bits.
 * Like a display row or the bits of a single letter within a larger text string.
 */
class BitSequence {
  protected bits: IndexedBit[] = [];

  static stripNonBits(s: string): string {
    return s.replace(/[^01]/g, "");
  }

  constructor(bits: IndexedBit[] | BitSequence) {
    if (bits instanceof BitSequence) {
      bits = bits.bits;
    }
    this.bits = bits;
  }

  appendBit(bit: string): BitSequence {
    return this.appendBits(bit);
  }

  /**
   * Appends bits to the sequence and re-indexes them.
   */
  appendBits(bits: BitSequence | string): BitSequence {
    if (typeof bits === "string") {
      return new BitSequence(this.bits.concat(BitSequence.indexBits(bits, this.lastIndex() + 1)));
    } else {
      return this.appendBitsAndReIndex(bits);
    }
  }

  appendBitsAndKeepIndex(bits: BitSequence): BitSequence {
    return new BitSequence(this.bits.concat(bits.bits));
  }

  appendBitsAndReIndex(bits: BitSequence): BitSequence {
    let newIndex = this.lastIndex() + 1;
    const newBits: IndexedBit[] = [];
    for (const oldBit of bits.bits) {
      newBits.push(new IndexedBit(oldBit.bit, newIndex));
      newIndex += 1;
    }
    return new BitSequence(this.bits.concat(newBits));
  }

  get length() {
    return this.bits.length;
  }

  startIndex(): number {
    if (this.bits.length === 0) {
      return 0;
    }
    return this.bits[0].index;
  }

  lastIndex(): number {
    return this.bits.length > 0 ? this.lastBit().index : -1;
  }

  firstBit(): IndexedBit {
    return this.bits[0];
  }

  lastBit(): IndexedBit {
    return this.bits[this.bits.length - 1];
  }

  getBit(index: number): IndexedBit {
    return this.bits[index];
  }

  /**
   * Finds the first occurrence of a bit in the sequence.
   *
   * @param bit a string or IndexedBit representing the bit value ("0" or "1") to find.
   * If an IndexedBit is provided, only the bit value is considered; the index is ignored.
   * @param startIndex the index to start searching from. Defaults to 0.
   */
  indexOf(bit: IndexedBit | "0" | "1", startIndex: number = 0): number {
    const toFind = typeof bit === "string" ? bit : bit.bit;
    let actualStart = startIndex;

    if (actualStart < 0) {
      actualStart = Math.max(this.bits.length + actualStart, 0);
    }
    if (actualStart >= this.bits.length) {
      return -1;
    }

    const foundIndex = this.bits.slice(actualStart).findIndex(b => b.bit === toFind);
    return foundIndex === -1 ? -1 : foundIndex + actualStart;
  }

  getBitByGlobalIndex(index: number): IndexedBit {
    return this.bits.find(bit => bit.index === index) || this.bits[index];
    // [2025-04-28] is this going to bite us?
  }

  toggleBit(index: number, globalIndex: null | number = null): BitSequence {
    if (globalIndex !== null) {
      index = this.bits.findIndex(bit => bit.index === globalIndex);
    }

    const newBits = this.bits.map((bit, i) => {
      if (i === index) {
        return new IndexedBit(bit.bit === "0" ? "1" : "0", bit.index);
      }
      return bit;
    });

    return new BitSequence(newBits);
  }

  slice(start: number, end?: number): BitSequence {
    const slicedBits = this.bits.slice(start, end);
    return new BitSequence(slicedBits);
  }

  [Symbol.iterator](): Iterator<IndexedBit> {
    let index = 0;
    const bits = this.bits;
    return {
      next(): IteratorResult<IndexedBit> {
        if (index < bits.length) {
          return {value: bits[index++], done: false};
        } else {
          return {value: undefined, done: true};
        }
      },
    };
  }

  toString(): string {
    return this.toPlainString();
  }

  toPlainString(): string {
    return this.bits.map(bit => bit.toString()).join("");
  }

  equals(o: unknown): boolean {
    if (o instanceof BitSequence) {
      return this.bits.length === o.bits.length &&
        this.bits.every((bit, index) => bit.equals(o.bits[index]));
    }
    return false;
  }

  static empty(): BitSequence {
    return new BitSequence([]);
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
   *
   * @example 1: removing non-bits
   *
   * If this was the encoding of the third letter in a word:
   * And your encoding was, say, 5 bits per letter.
   * Then the bit indices for the first letter would be 0-4,
   * the second letter would be 5-9,
   * and this, the third letter, would be 10-14.
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
    const indexedBits = this.indexBitsFromString(s, startIndex);
    return new BitSequence(indexedBits);
  }

  static indexBitsFromString(s: string, startIndex: number) {
    const stripped = BitSequence.stripNonBits(s);
    return BitSequence.indexBits(stripped, startIndex);
  }

  /**
   *
   * @param s
   * @param startIndex
   */
  static indexBits(s: string, startIndex: number = 0): IndexedBit[] {
    const bits = BitSequence.stripNonBits(s);
    const indexedBits: IndexedBit[] = [];
    for (const [index, bit] of [...bits].entries()) {
      indexedBits.push(new IndexedBit(bit as "0" | "1", index + startIndex));
    }
    return indexedBits;
  }
}

export { BitSequence };
