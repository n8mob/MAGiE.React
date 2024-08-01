import {beforeEach, describe, expect, it} from "vitest";
import FixedWidthEncoder from "../encoding/FixedWidthEncoder.ts";
import FixedWidthEncodingJudge from "../judgment/FixedWidthEncodingJudge.ts";
import {CharJudgment, DisplayRowJudgment, SequenceJudgment} from "../judgment/SequenceJudgment.ts";

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

const splitBy4 = function* (bits: string) {
  let b2 = bits;
  while (b2 && b2.length > 0) {
    yield b2.slice(0, 4);
    b2 = b2.slice(4);
  }
};

describe('FixedWidthEncodingJudge', () => {
  let unitUnderTest: FixedWidthEncodingJudge;

  beforeEach(() => {
    unitUnderTest = new FixedWidthEncodingJudge(new FixedWidthEncoder(4, hexadecimal));
  });

  describe('judgeBits', () => {
    it('should judge a single correct character', () => {
      const guess = '1010';
      const win = '1010';
      const judgment = unitUnderTest.judgeBits<SequenceJudgment>(guess, win, splitBy4);
      expect(judgment.isCorrect).toBe(true);
      expect(judgment.correctGuess).toBe(guess);
      expect(judgment.sequenceJudgments).toEqual([
        new CharJudgment(guess, "1111")
      ]);
    });

    it('should judge two correct display rows', () => {
      const guess = "11111110";
      const win = "11111110";
      const judgment = unitUnderTest.judgeBits<DisplayRowJudgment>(guess, win, splitBy4);
      expect(judgment.isCorrect).toBe(true);
      expect(judgment.correctGuess).toBe(guess);
      const rowJudgments = judgment.getRowJudgments();
      let nextJudgment = rowJudgments.next();
      while (!nextJudgment.done) {
        expect(nextJudgment.value.isSequenceCorrect).toBe(true);
        nextJudgment = rowJudgments.next();
      }
    });

    it('should judge the third character as incorrect', () => {
      const guess = "000100100100";
      const win = "000100100011";
      const judgment = unitUnderTest.judgeBits<SequenceJudgment>(guess, win, splitBy4);
      expect(judgment.isCorrect).toBe(false);
      expect(judgment.correctGuess).toBe(guess.slice(0, 9));
      const charJudgments = judgment.getCharJudgments();
      const firstChar: CharJudgment = charJudgments.next().value;
      expect(firstChar.isSequenceCorrect).toBe(true);
      expect(firstChar.guess).toBe(guess.slice(0, 4));
      const secondChar = charJudgments.next().value;
      expect(secondChar.isSequenceCorrect).toBe(true);
      expect(secondChar.guess).toBe(guess.slice(4, 8));
      const thirdChar = charJudgments.next().value;
      expect(thirdChar.isSequenceCorrect).toBe(false);
      expect(thirdChar.guess).toBe(guess.slice(8, 12));
      expect(thirdChar.bitJudgments[0].isCorrect).toBe(true);
      expect(thirdChar.bitJudgments[1].isCorrect).toBe(false);
      expect(thirdChar.bitJudgments[2].isCorrect).toBe(false);
      expect(thirdChar.bitJudgments[3].isCorrect).toBe(false);
    });
  });

  describe('judgeText', () => {
    it('should judge a single correct character', () => {
      const guess = 'A';
      const win = 'A';
      const judgment = unitUnderTest.judgeText(guess, win);
      expect(judgment.isCorrect).toBe(true);
      expect(judgment.correctGuess).toBe('1010');
      expect(judgment.sequenceJudgments).toEqual([
        new CharJudgment("1010", "1111")
      ]);
    });
  });
});
