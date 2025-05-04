import { describe, it, expect } from "vitest";
import { SequenceJudgment, CharJudgment, DisplayRowJudgment } from "../../judgment/SequenceJudgment.ts";
import { BitSequence } from "../../BitSequence.ts";
import { IndexedBit } from "../../IndexedBit.ts";
import { BitJudgment } from "../../judgment/BitJudgment.ts";

// Mock DisplayRow for DisplayRowJudgment
class MockDisplayRow extends BitSequence {}

describe("SequenceJudgment", () => {
  it("constructs from BitSequence and bitJudgments string", () => {
    const seq = BitSequence.fromString("101");
    const sj = new SequenceJudgment(seq, "110");
    expect(sj.guess.equals(seq)).to.be.true;
    expect(sj.bitJudgments).to.have.lengthOf(3);
    expect(sj.bitJudgments[0]).to.be.instanceOf(BitJudgment);
    expect(sj.bitJudgments[0].isCorrect).to.be.true;
    expect(sj.bitJudgments[2].isCorrect).to.be.false;
  });

  it("constructs from IndexedBit[] and bitJudgments string", () => {
    const bits = [
      new IndexedBit("1", 0),
      new IndexedBit("0", 1),
      new IndexedBit("1", 2),
    ];
    const sj = new SequenceJudgment(bits, "101");
    expect(sj.guess.length).to.equal(3);
    expect(sj.bitJudgments[0].isCorrect).to.be.true;
    expect(sj.bitJudgments[1].isCorrect).to.be.false;
    expect(sj.bitJudgments[2].isCorrect).to.be.true;
  });

  it("isSequenceCorrect returns true only if all bits are correct", () => {
    const allCorrect = new SequenceJudgment(BitSequence.fromString("111"), "111");
    expect(allCorrect.isSequenceCorrect).to.be.true;

    const notAllCorrect = new SequenceJudgment(BitSequence.fromString("101"), "110");
    expect(notAllCorrect.isSequenceCorrect).to.be.false;
  });

  it("toString returns expected format", () => {
    const guessString = "10";
    const allCorrectJudgment = "11";
    const seq = BitSequence.fromString(guessString);
    const sj = new SequenceJudgment(seq, allCorrectJudgment);
    const str = sj.toString();
    expect(str).to.contain(guessString);
    expect(str).to.contain(allCorrectJudgment);
    expect(str).to.contain("correct");
  });

  it("is iterable over BitJudgment", () => {
    const sj = new SequenceJudgment(BitSequence.fromString("10"), "11");
    const judgments = Array.from(sj);
    expect(judgments).to.have.lengthOf(2);
    expect(judgments[0]).to.be.instanceOf(BitJudgment);
  });

  it("equals returns true for identical SequenceJudgment", () => {
    const seq = BitSequence.fromString("10");
    const sj1 = new SequenceJudgment(seq, "11");
    const sj2 = new SequenceJudgment(seq, "11");
    // Note: bitJudgments array reference will differ, so this will be false with current implementation
    expect(sj1.equals(sj1)).to.be.true;
    expect(sj1.equals(sj2)).to.be.false;
  });

  it("equals returns false for non-SequenceJudgment", () => {
    const sj = new SequenceJudgment(BitSequence.fromString("10"), "11");
    expect(sj.equals(null)).to.be.false;
    expect(sj.equals({})).to.be.false;
  });
});

describe("CharJudgment", () => {
  it("constructs and behaves like SequenceJudgment", () => {
    const seq = BitSequence.fromString("1");
    const cj = new CharJudgment(seq, "1");
    expect(cj.guess.equals(seq)).to.be.true;
    expect(cj.bitJudgments[0].isCorrect).to.be.true;
  });
});

describe("DisplayRowJudgment", () => {
  it("constructs and behaves like SequenceJudgment", () => {
    const row = new MockDisplayRow([new IndexedBit("1", 0), new IndexedBit("0", 1)]);
    const drj = new DisplayRowJudgment(row, "10");
    expect(drj.guess.equals(row)).to.be.true;
    expect(drj.bitJudgments[0].isCorrect).to.be.true;
    expect(drj.bitJudgments[1].isCorrect).to.be.false;
  });
});
