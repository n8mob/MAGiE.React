import { describe, expect, it } from "vitest";
import { BitSequence } from "../BitSequence";
import { IndexedBit } from "../IndexedBit";

describe("BitSequence core mutator methods", () => {
  it("appendBit should add a bit and return a new BitSequence", () => {
    const seq = BitSequence.fromString("10");
    const newSeq = seq.appendBit("1");
    expect(newSeq.toString()).to.equal("101");
    expect(seq.toString()).to.equal("10"); // original unchanged
  });

  it("appendBits should add bits from string and return a new BitSequence", () => {
    const seq = BitSequence.fromString("10");
    const newSeq = seq.appendBits("01");
    expect(newSeq.toString()).to.equal("1001");
    expect(seq.toString()).to.equal("10");
  });

  it("toggleBit should flip the bit at the given index", () => {
    const seq = BitSequence.fromString("101");
    const toggled = seq.toggleBit(1);
    expect(toggled.toString()).to.equal("111");
    expect(seq.toString()).to.equal("101");
  });

  it("slice should return a new BitSequence with the correct bits", () => {
    const seq = BitSequence.fromString("10101");
    const sliced = seq.slice(1, 4);
    expect(sliced.toString()).to.equal("010");
    expect(seq.toString()).to.equal("10101");
  });
});

describe("BitSequence other tests", () => {
  it("should return true when .endsWith(null) is called on an empty BitSequence", () => {
    const emptySequence = BitSequence.empty();
    // noinspection TypeScriptValidateTypes
    expect(emptySequence.endsWith(null)).to.be.true;
  });

  it("should return false when .endsWith(null) is called on a non-empty BitSequence", () => {
    const nonEmptySequence = BitSequence.fromString("101");
    // noinspection TypeScriptValidateTypes
    expect(nonEmptySequence.endsWith(null)).to.be.false;
  });

  it("should return true when .endsWith('0') is called on a BitSequence ending with '0'", () => {
    const sequence = BitSequence.fromString("1010");
    expect(sequence.endsWith("0")).to.be.true;
  });

  it("should return false when .endsWith('0') is called on a BitSequence not ending with '0'", () => {
    const sequence = BitSequence.fromString("1011");
    expect(sequence.endsWith("0")).to.be.false;
  });

  it("should return true when .endsWith('1') is called on a BitSequence ending with '1'", () => {
    const sequence = BitSequence.fromString("1011");
    expect(sequence.endsWith("1")).to.be.true;
  });

  it('should return true when .endsWith("01") is called on a BitSequence ending with "01"', () => {
    const sequence = BitSequence.fromString("10101");
    expect(sequence.endsWith("01")).to.be.true;
  });

  it('should return true when .startsWith("01") is called on a BitSequence starting with "01"', () => {
    const sequence = BitSequence.fromString("01010");
    expect(sequence.startsWith("01")).to.be.true;
  });
});

describe("BitSequence.fromString", () => {
  // Also tests BitSequence.empty() which is a shortcut to BitSequence.fromString("")
  it("should create a BitSequence from a string with valid bits", () => {
    const sequence = BitSequence.fromString("1010");
    expect(sequence).to.be.instanceof(BitSequence);
  });

  it("should strip non-bit characters when creating from a string", () => {
    const expected = BitSequence.fromString("1010");
    const actual = BitSequence.fromString("1a0b1c0");
    expect(actual).to.be.instanceof(BitSequence);
    expect(actual).to.deep.equal(expected);
  });

  it("should create a BitSequence from a BitString", () => {
    const bitString = "1100";
    const sequence = BitSequence.fromString(bitString);
    const expectedBits: IndexedBit[] = [
      new IndexedBit("1", 0),
      new IndexedBit("1", 1),
      new IndexedBit("0", 2),
      new IndexedBit("0", 3),
    ];
    expect(sequence).to.deep.equal(new BitSequence(expectedBits));
  });

  it("should correctly assign indices starting from a given startIndex", () => {
    const bitString = "101";
    const sequence = BitSequence.fromString(bitString, 5);
    const expectedBits: IndexedBit[] = [
      new IndexedBit("1", 5),
      new IndexedBit("0", 6),
      new IndexedBit("1", 7),
    ];
    expect(sequence).to.deep.equal(new BitSequence(expectedBits));
  });

  it("should handle an empty string input", () => {
    const sequence = BitSequence.empty();
    expect(sequence).to.deep.equal(new BitSequence([]));
  });

  it("should handle an empty BitString input", () => {
    const sequence = BitSequence.empty();
    expect(sequence).to.deep.equal(new BitSequence([]));
  });

  it('should evaluate isEmpty correctly', () => {
    const sequence = BitSequence.empty();
    expect(sequence.isEmpty).to.be.true;
  });
});

describe("BitSequence.indexOf", () => {
  it("should return the correct index of a bit ('1')", () => {
    const sequence = BitSequence.fromString("10101");
    expect(sequence.indexOf("1")).to.equal(0);
    expect(sequence.indexOf("1", 1)).to.equal(2);
    expect(sequence.indexOf("1", 3)).to.equal(4);
  });

  it("should return the correct index of a bit ('0')", () => {
    const sequence = BitSequence.fromString("10101");
    expect(sequence.indexOf("0")).to.equal(1);
    expect(sequence.indexOf("0", 2)).to.equal(3);
  });

  it("should return -1 if the bit is not found", () => {
    const sequence = BitSequence.fromString("11111");
    expect(sequence.indexOf("0")).to.equal(-1);
  });

  it("should return the correct index of an IndexedBit", () => {
    const sequence = BitSequence.fromString("10101");
    const bit = new IndexedBit("1", 2);
    expect(sequence.indexOf(bit)).to.equal(0); // Matches the bit value, not the index
  });

  it("should return -1 if the IndexedBit is not found", () => {
    const plainString = "10101";
    expect(plainString.indexOf("1", 10)).to.equal(-1);

    const plainArray = plainString.split("");
    expect(plainArray.indexOf("1", 10)).to.equal(-1);

    const sequence = BitSequence.fromString("10101");
    const bit = new IndexedBit("0", 10);
    expect(sequence.indexOf(bit, 10), "string and array both passed... why not this?").to.equal(-1);
  });
});

describe("BitSequence.equals", () => {
  it("should return true for two identical BitSequences", () => {
    const sequence1 = BitSequence.fromString("10101");
    const sequence2 = BitSequence.fromString("10101");
    expect(sequence1.equals(sequence2)).to.be.true;
  });

  it("should return false for BitSequences with different lengths", () => {
    const sequence1 = BitSequence.fromString("10101");
    const sequence2 = BitSequence.fromString("101");
    expect(sequence1.equals(sequence2)).to.be.false;
  });

  it("should return false for BitSequences with the same length but different bits", () => {
    const sequence1 = BitSequence.fromString("10101");
    const sequence2 = BitSequence.fromString("11111");
    expect(sequence1.equals(sequence2)).to.be.false;
  });

  it("should return true for empty BitSequences", () => {
    const sequence1 = BitSequence.empty();
    const sequence2 = BitSequence.empty();
    expect(sequence1.equals(sequence2)).to.be.true;
  });

  it("should return false when comparing a BitSequence to a non-BitSequence object", () => {
    const sequence = BitSequence.fromString("10101");
    expect(sequence.equals("10101")).to.be.false;
    expect(sequence.equals(null)).to.be.false;
    expect(sequence.equals(undefined)).to.be.false;
  });
});
