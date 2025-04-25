import IndexedBit from "./IndexedBit.ts";

type BitString = `${"0" | "1"}`;

class BitSequence {
  private bits: IndexedBit[] = [];

  private static stripNonBits(s: string): BitString {
    return s.replace(/[^01]/g, "") as BitString;
  }

  private constructor(bits: IndexedBit[]) {
    this.bits = bits;
  }

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