import { beforeEach, describe, expect, it } from "vitest";
import { FixedWidthEncoder } from "../../encoding/FixedWidthEncoder.ts";
import { FixedWidthEncodingJudge } from "../../judgment/FixedWidthEncodingJudge.ts";
import { SequenceJudgment } from "../../judgment/SequenceJudgment.ts";
import { DisplayRow } from "../../encoding/DisplayRow.ts";
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

const splitBy4 = function* (bits: BitSequence) {
  let b2 = bits;
  const WIDTH = 4;

  while (b2 && b2.length > 0) {
    yield new DisplayRow(b2.slice(0, WIDTH));
    b2 = b2.slice(WIDTH);
  }
};

describe('FixedWidthEncodingJudge', () => {
  let unitUnderTest: FixedWidthEncodingJudge;

  beforeEach(() => {
    unitUnderTest = new FixedWidthEncodingJudge(new FixedWidthEncoder(4, hexadecimal));
  });

  describe('judgeBits', () => {
    it('should judge a single correct character', () => {
      const guess = DisplayRow.fromString("1010", 0, "A");
      const win = BitSequence.fromString("1010");
      const actualFullJudgment = unitUnderTest.judgeBits(guess, win, splitBy4);
      expect(actualFullJudgment.isCorrect, "isCorrect should be true").to.be.true;
      !expect(actualFullJudgment.correctGuess, "correctGuess should not be undefined").to.not.be.undefined;
      !expect(actualFullJudgment.correctGuess, "correctGuess should not be null").to.not.be.null;
      expect(actualFullJudgment.sequenceJudgments, "there should be exactly one sequenceJudgment").to.have.lengthOf(1);
      expect(actualFullJudgment.correctGuess.equals(guess), "correctGuess should equal the guess").to.be.true;

      const actualSequenceJudgment: SequenceJudgment = actualFullJudgment.sequenceJudgments[0];
      expect(actualSequenceJudgment.isSequenceCorrect).to.be.true;
      for (let i = 0; i < actualSequenceJudgment.guess.length; i++) {
        expect(actualSequenceJudgment.guess.getBit(i).bit).to.equal(guess.getBit(i).bit);
        expect(actualSequenceJudgment.guess.getBit(i).index).to.equal(guess.getBit(i).index);
        expect(actualSequenceJudgment.bitJudgments[i].isCorrect).to.be.true;
      }
    });

    it('should judge two correct display rows', () => {
      const guess = BitSequence.fromString("11111110");
      const win = BitSequence.fromString("11111110");
      const judgment = unitUnderTest.judgeBits(guess, win, splitBy4);
      expect(judgment.isCorrect).to.be.true;
      expect(judgment.correctGuess.equals(guess), "correctGuess should equal guess").to.be.true;
      const rowJudgments = judgment.getRowJudgments();
      let nextJudgment = rowJudgments.next();
      while (!nextJudgment.done) {
        expect(nextJudgment.value.isSequenceCorrect).to.be.true;
        nextJudgment = rowJudgments.next();
      }
    });

    it('should judge the third character as incorrect', () => {
      const guess = BitSequence.fromString("000100100100"); // 0001 0010 0100
      const win =   BitSequence.fromString("000100100011");  //  0001 0010 0011
      const actualFullJudgment = unitUnderTest.judgeBits(guess, win, splitBy4);
      expect(actualFullJudgment.isCorrect).to.be.false;
      expect(
        actualFullJudgment.correctGuess.equals(guess.slice(0, 9)),
        "correctGuess should equal guess")
        .to.be.true;
      const actualCharJudgments = actualFullJudgment.sequenceJudgments;

      expect(actualCharJudgments).to.have.lengthOf(3);
      expect(actualCharJudgments[0].isSequenceCorrect).to.be.true;
      expect(actualCharJudgments[1].isSequenceCorrect).to.be.true;

      const thirdCharJudgment = actualCharJudgments[2];

      expect(thirdCharJudgment.bitJudgments[0].isCorrect).to.be.true;
      expect(thirdCharJudgment.bitJudgments[1].isCorrect).to.be.false;
      expect(thirdCharJudgment.bitJudgments[2].isCorrect).to.be.false;
      expect(thirdCharJudgment.bitJudgments[3].isCorrect).to.be.false;
    });

    it('should handle guess longer than win', () => {
      const guess = BitSequence.fromString("10101111"); // 8 bits
      const win = BitSequence.fromString("1010");       // 4 bits
      const fullJudgment = unitUnderTest.judgeBits(guess, win, splitBy4);
      expect(fullJudgment.isCorrect).to.be.false;
      expect(fullJudgment.sequenceJudgments).to.have.lengthOf(2);
      // First chunk compared, second chunk (extra guess) all incorrect
      expect(fullJudgment.sequenceJudgments[1].bitJudgments.every(j => !j.isCorrect)).to.be.true;
    });

    it('should handle win longer than guess', () => {
      const guess = BitSequence.fromString("1010");       // 4 bits
      const win = BitSequence.fromString("10101111");     // 8 bits
      const fullJudgment = unitUnderTest.judgeBits(guess, win, splitBy4);
      expect(fullJudgment.sequenceJudgments).to.have.lengthOf(2);
      expect(fullJudgment.sequenceJudgments[0].isSequenceCorrect).to.be.true;
      // First chunk compared, second chunk (extra win) all incorrect
      expect(fullJudgment.sequenceJudgments[1].bitJudgments.every(j => j.isCorrect)).to.be.false;
      expect(fullJudgment.isCorrect).to.be.false;
    });

    it('should judge a partial character (6-bit guess vs 8-bit win) accurately', () => {
      // win: 11001100 (8 bits, two chars: 1100 1100)
      // guess: 110011 (6 bits, one full char and two bits of the next)
      const win = BitSequence.fromString("11001100");
      const guess = BitSequence.fromString("110011");
      const actual = unitUnderTest.judgeBits(guess, win, splitBy4);

      // Should have two sequence judgments: one full, one partial
      expect(actual.sequenceJudgments).to.have.lengthOf(2);

      // First chunk: should be a correct full character
      const first = actual.sequenceJudgments[0];
      expect(first.guess.toString()).to.equal("1100");
      expect(first.isSequenceCorrect).to.be.true;

      // Second chunk: only two bits guessed, compare to win's "11"
      const second = actual.sequenceJudgments[1];
      expect(second.guess.toString()).to.equal("11");
      // Compare to win's "11" (from "1100"), so both bits should be correct
      expect(second.bitJudgments[0].isCorrect).to.be.true;
      expect(second.bitJudgments[1].isCorrect).to.be.true;
      expect(second.isSequenceCorrect).to.be.false;

      // Full judgment should be true, as all guessed bits match
      expect(actual.isCorrect).to.be.false;
    });
  });

  describe('judgeText', () => {
    it('should judge a single correct character', () => {
      const guessText = 'A';
      const winText = 'A';
      const guessBits = unitUnderTest.encoder.encodeText(guessText);
      const judgment = unitUnderTest.judgeText(guessText, winText);
      expect(judgment.isCorrect).to.be.true;
      expect(judgment.correctGuess.equals(guessBits)).to.be.true;
    });
  });
});
