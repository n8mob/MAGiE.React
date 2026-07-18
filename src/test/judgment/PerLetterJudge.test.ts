import { beforeEach, describe, expect, it } from "vitest";
import { FixedWidthEncoder } from "../../encoding/FixedWidthEncoder.ts";
import { PerLetterJudge } from "../../judgment/PerLetterJudge.ts";
import { Correctness } from "../../judgment/BitJudgment.ts";
import { BitSequence } from "../../BitSequence.ts";

const hexadecimal = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  'A': 10,
  'B': 11,
  'C': 12,
  'D': 13,
  'E': 14,
  'F': 15
};

describe('PerLetterJudge', () => {
  let encoder: FixedWidthEncoder;
  let unitUnderTest: PerLetterJudge;

  const judge = (guess: BitSequence, win: BitSequence) =>
    unitUnderTest.judgeBits(guess, win, (bits) => encoder.splitByChar(bits));

  beforeEach(() => {
    encoder = new FixedWidthEncoder(4, hexadecimal);
    unitUnderTest = new PerLetterJudge(encoder);
  });

  it('judges a fully correct letter as correct on every bit', () => {
    const win = encoder.encodeText("A");
    const guess = BitSequence.fromString("1010");

    const fullJudgment = judge(guess, win);

    expect(fullJudgment.isCorrect).to.be.true;
    expect(fullJudgment.sequenceJudgments).to.have.lengthOf(1);
    expect(fullJudgment.sequenceJudgments[0].isSequenceCorrect).to.be.true;
    for (const bitJudgment of fullJudgment.sequenceJudgments[0].bitJudgments) {
      expect(bitJudgment.correctness).to.equal(Correctness.correct);
    }
  });

  it('marks every bit of a letter incorrect when one bit is wrong (no bit-level leak)', () => {
    const win = encoder.encodeText("A");   // 1010
    const guess = BitSequence.fromString("1011"); // three bits individually match

    const fullJudgment = judge(guess, win);

    expect(fullJudgment.isCorrect).to.be.false;
    expect(fullJudgment.sequenceJudgments[0].isSequenceCorrect).to.be.false;
    for (const bitJudgment of fullJudgment.sequenceJudgments[0].bitJudgments) {
      expect(bitJudgment.correctness).to.equal(Correctness.incorrect);
    }
  });

  it('judges each letter independently', () => {
    const win = encoder.encodeText("AB");  // 1010 1011
    const guess = BitSequence.fromString("10100000"); // first letter right, second all-off

    const fullJudgment = judge(guess, win);

    expect(fullJudgment.isCorrect).to.be.false;
    expect(fullJudgment.sequenceJudgments).to.have.lengthOf(2);
    expect(fullJudgment.sequenceJudgments[0].isSequenceCorrect).to.be.true;
    expect(fullJudgment.sequenceJudgments[1].isSequenceCorrect).to.be.false;
  });

  it('starts an all-off guess with every letter incorrect except letters that encode to zero', () => {
    const win = encoder.encodeText("0A0"); // '0' encodes to 0000 — the "space is free" case
    const guess = BitSequence.fromString("000000000000");

    const fullJudgment = judge(guess, win);

    expect(fullJudgment.isCorrect).to.be.false;
    expect(fullJudgment.sequenceJudgments[0].isSequenceCorrect).to.be.true;
    expect(fullJudgment.sequenceJudgments[1].isSequenceCorrect).to.be.false;
    expect(fullJudgment.sequenceJudgments[2].isSequenceCorrect).to.be.true;
  });

  it('reports overall correctness only when every letter is correct', () => {
    const win = encoder.encodeText("FF");
    const guess = encoder.encodeText("FF");

    const fullJudgment = judge(guess, win);

    expect(fullJudgment.isCorrect).to.be.true;
    expect(fullJudgment.correctGuess.equals(guess)).to.be.true;
  });

  it('treats a short guess as incorrect for the missing letters', () => {
    const win = encoder.encodeText("AB");
    const guess = BitSequence.fromString("1010"); // only the first letter

    const fullJudgment = judge(guess, win);

    expect(fullJudgment.isCorrect).to.be.false;
    expect(fullJudgment.sequenceJudgments).to.have.lengthOf(2);
    expect(fullJudgment.sequenceJudgments[0].isSequenceCorrect).to.be.true;
    expect(fullJudgment.sequenceJudgments[1].isSequenceCorrect).to.be.false;
  });

  it('treats superfluous guess letters as incorrect', () => {
    const win = encoder.encodeText("A");
    const guess = BitSequence.fromString("10101111");

    const fullJudgment = judge(guess, win);

    expect(fullJudgment.isCorrect).to.be.false;
    expect(fullJudgment.sequenceJudgments).to.have.lengthOf(2);
    expect(fullJudgment.sequenceJudgments[1].isSequenceCorrect).to.be.false;
  });

  it('judges text through judgeText', () => {
    const fullJudgment = unitUnderTest.judgeText("AB", "AB");
    expect(fullJudgment.isCorrect).to.be.true;
  });
});
