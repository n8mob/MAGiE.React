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

  equals(other: IndexedBit | string): boolean {
    if (this.bit === undefined) {
      return false;
    }
    if (typeof other === "string") {
      return this.bit === other;
    }
    if (!other || other.bit === undefined) {
      return false;
    }
    return this.bit === other.bit && this.index === other.index;
  }

  static trueAtIndex(index: number): IndexedBit {
    return new IndexedBit("1", index);
  }

  static falseAtIndex(index: number): IndexedBit {
    return new IndexedBit("0", index);
  }
}

export { IndexedBit };
