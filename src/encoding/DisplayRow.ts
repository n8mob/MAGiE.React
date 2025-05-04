import { IndexedBit } from "../IndexedBit.ts";
import { BitSequence } from "../BitSequence.ts";

class DisplayRow extends BitSequence {
  annotation: string;

  constructor(bits: IndexedBit[] | BitSequence, annotation: string = "") {
    super(bits);
    this.annotation = annotation;
  }

  toString(): string {
    const bitString = this.bits.map(bit => bit.bit).join("");
    return `${bitString} ${this.annotation}`.trim();
  }

  static fromString(s: string, startIndex: number = 0, annotation: string = ""): DisplayRow {
    const bits = BitSequence.indexBits(s, startIndex);
    return new DisplayRow(bits, annotation);
  }
}

export { DisplayRow };
