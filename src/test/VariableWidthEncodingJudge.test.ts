import { VariableWidthEncodingJudge } from "../judgment/VariableWidthEncodingJudge.ts";
import { beforeEach, describe, expect, it } from "vitest";
import { VariableWidthEncoder } from "../encoding/VariableWidthEncoder.ts";
import { DisplayRow } from "../encoding/DisplayRow.ts";
import { BitSequence } from "../BitSequence.ts";
import { BitJudgment } from "../judgment/BitJudgment.ts";

describe('VariableWidthEncodingJudge', () => {
  let unitUnderTest: VariableWidthEncodingJudge;
  const rowWidth = 13;
  const split = function* (bits: BitSequence) {
    let b2 = bits;
    while (b2 && b2.length > 0) {
      yield new DisplayRow(b2.slice(0, rowWidth));
      b2 = b2.slice(rowWidth);
    }
  }

  beforeEach(() => {
    const encoder: VariableWidthEncoder = new VariableWidthEncoder(
      {
        "1": {
          "A": "1",
          "B": "11",
          "C": "111"
        },
        "0": {
          "": "0",
          " ": "00",
          ".": "000",
          ". ": "00000"
        }
      });

    unitUnderTest = new VariableWidthEncodingJudge(encoder);
  });

  it("should judge a single correct character", () => {
    const guessBits = DisplayRow.fromString("1111");
    const winBits = BitSequence.fromString("1111");

    const actual = unitUnderTest.judgeBits(guessBits, winBits, split);

    expect(actual.isCorrect).to.be.true;
    expect(actual.correctGuess.toPlainString()).to.equal("1111");
    const charJudgments = actual.getCharJudgments();
    let nextCharJudgment = charJudgments.next();
    while (!nextCharJudgment.done) {
      expect(nextCharJudgment.value.bitJudgments).to.have.length(4);
      expect(nextCharJudgment.value
                             .bitJudgments
                             .map(bitJudgment => bitJudgment.isCorrect ? "1" : "0")
                             .join("")
      ).to.equal("1111");
      nextCharJudgment = charJudgments.next();
    }
  });

  // noinspection DuplicatedCode
  it("should judge a string of correct characters", () => {
    const guessText = "A CAB.";
    const winText = "A CAB.";

    const actualFullJudgment = unitUnderTest.judgeText(guessText, winText);
    expect(actualFullJudgment.isCorrect).to.be.true;

    const actualCharJudgments = actualFullJudgment.getCharJudgments();
    // oh, it's including character spaces.
    // should those go after the letters (A => 110?)
    // I don't think so.

    const expectedBitSequences = [
      "1", // A
      "00", // space
      "111", // C
      "0", // character space
      "1", // A
      "0", // character space
      "11", // B
      "000" // period
    ][Symbol.iterator]();

    let nextCharJudgment = actualCharJudgments.next();
    let nextExpected = expectedBitSequences.next();

    while (!nextCharJudgment.done && !nextExpected.done) {
      const charJudgment = nextCharJudgment.value;
      const expected = nextExpected.value;
      expect(charJudgment.isSequenceCorrect).to.be.true;
      const actualSequenceGuess = charJudgment.guess.toPlainString();
      expect(actualSequenceGuess).to.equal(expected);

      nextCharJudgment = actualCharJudgments.next();
      nextExpected = expectedBitSequences.next();
    }
  });

  it('should correctly judge a guess shorter than winText', () => {
    const guessText = "A CAB";
    const winText = "A CAB.";

    const actualFullJudgment = unitUnderTest.judgeText(guessText, winText);
    expect(actualFullJudgment.isCorrect).to.be.false;

    const actualCharJudgments = actualFullJudgment.getCharJudgments();
    const expectedGuesses = [
      "1", // A
      "00", // space
      "111", // C
      "0", // character space
      "1", // A
      "0", // character space
      "11" // B
    ][Symbol.iterator]();

    let nextCharJudgment = actualCharJudgments.next();
    let nextExpected = expectedGuesses.next();

    while (!nextCharJudgment.done && !nextExpected.done) {
      const charJudgment = nextCharJudgment.value;
      const expected = nextExpected.value;
      const actualSequenceGuess = charJudgment.guess.toPlainString();
      expect(actualSequenceGuess).to.equal(expected);
      expect(charJudgment.isSequenceCorrect).to.be.true;

      nextCharJudgment = actualCharJudgments.next();
      nextExpected = expectedGuesses.next();
    }

    expect(nextCharJudgment.done).to.be.false;
    const lastCharJudgment = nextCharJudgment.value;
    expect(lastCharJudgment.isSequenceCorrect).to.be.false;
    const bitJudgments = lastCharJudgment.bitJudgments.map((bj: BitJudgment) => bj.bit).join("");
    expect(bitJudgments).to.equal("000");
  });

  it('should correctly judge guess longer than winText', () => {
    const guessText = "A CAB.A";
    const winText = "A CAB.";
    const actualFullJudgment = unitUnderTest.judgeText(guessText, winText);
    expect(actualFullJudgment.isCorrect).to.be.false;
    const actualCharJudgments = actualFullJudgment.getCharJudgments();
    const expectedGuesses = [
      "1", // A
      "00", // space
      "111", // C
      "0", // character space
      "1", // A
      "0", // character space
      "11", // B
      "000", // period
      "1" // A
    ][Symbol.iterator]();

    let nextCharJudgment = actualCharJudgments.next();
    let nextExpected = expectedGuesses.next();

    while (!nextCharJudgment.done && !nextExpected.done && nextCharJudgment.value.isSequenceCorrect) {
      const charJudgment = nextCharJudgment.value;
      const expected = nextExpected.value;
      const actualSequenceGuess = charJudgment.guess.toPlainString();
      expect(actualSequenceGuess).to.equal(expected);
      expect(charJudgment.isSequenceCorrect).to.be.true;

      nextCharJudgment = actualCharJudgments.next();
      nextExpected = expectedGuesses.next();
    }

    expect(nextCharJudgment.done).to.be.false;
    const lastCharJudgment = nextCharJudgment.value;
    expect(lastCharJudgment.isSequenceCorrect).to.be.false;
    const judgmentGuess = lastCharJudgment.bitJudgments.map((bj: BitJudgment) => bj.bit).join("");
    expect(judgmentGuess).to.equal("1");
    expect(lastCharJudgment.toString()).to.contain('not');
    expect(lastCharJudgment.toString()).to.contain('correct');
    nextCharJudgment = actualCharJudgments.next();
    expect(nextCharJudgment.done).to.be.true;
  });
});
