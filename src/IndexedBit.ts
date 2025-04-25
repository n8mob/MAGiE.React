import { toBitString } from "./BitSequence.ts";

class IndexedBit {
  /**
   * The bit value, which can be "0" or "1".
   * undefined is also allowed. I'm expecting to use that when, say, a guess has not been entered for this bit yet.
   */
  bit: "0" | "1" | undefined;
  /**
   * The global index of the bit in the entire bit string.
   */
  index: number;

  constructor(bit: "0" | "1" | undefined, globalIndex: number) {
    this.bit = bit;
    this.index = globalIndex;
  }

  get isChecked(): boolean {
    return this.bit === "1";
  }

  toString(): string {
    return this.bit ?? " ";
  }

  equals(other: IndexedBit): boolean {
    return this.bit === other.bit && this.index === other.index;
  }
}

export default IndexedBit;
