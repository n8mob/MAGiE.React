import { describe, expect, it } from "vitest";
import BitSequence, { BitString } from "../BitSequence";
import IndexedBit from "../IndexedBit";

describe("BitSequence", () => {
  it("should create a BitSequence from a string with valid bits", () => {
    const sequence = BitSequence.fromString("1010");
    expect(sequence).toBeInstanceOf(BitSequence);
  });

  it("should strip non-bit characters when creating from a string", () => {
    const sequence = BitSequence.fromString("1a0b1c0");
    const expectedBits: IndexedBit[] = [
      new IndexedBit("1", 0),
      new IndexedBit("0", 1),
      new IndexedBit("1", 2),
      new IndexedBit("0", 3),
    ];
    expect(sequence).toEqual(BitSequence.fromBitString("1010"));
  });

  it("should create a BitSequence from a BitString", () => {
    const bitString: BitString = "1100";
    const sequence = BitSequence.fromBitString(bitString);
    const expectedBits: IndexedBit[] = [
      new IndexedBit("1", 0),
      new IndexedBit("1", 1),
      new IndexedBit("0", 2),
      new IndexedBit("0", 3),
    ];
    expect(sequence).toEqual(new BitSequence(expectedBits));
  });

  it("should correctly assign indices starting from a given startIndex", () => {
    const bitString: BitString = "101";
    const sequence = BitSequence.fromBitString(bitString, 5);
    const expectedBits: IndexedBit[] = [
      new IndexedBit("1", 5),
      new IndexedBit("0", 6),
      new IndexedBit("1", 7),
    ];
    expect(sequence).toEqual(new BitSequence(expectedBits));
  });

  it("should handle an empty string input", () => {
    const sequence = BitSequence.fromString("");
    expect(sequence).toEqual(new BitSequence([]));
  });

  it("should handle an empty BitString input", () => {
    const sequence = BitSequence.fromBitString("" as BitString);
    expect(sequence).toEqual(new BitSequence([]));
  });
});
