import FixedWidthEncoder from "../FixedWidthEncoder.ts";
import {beforeEach, describe, expect, it} from "vitest";
import {CharJudgment, DisplayRowJudgment, SequenceJudgment} from "../SequenceJudgment.ts";

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

describe('FixedWidthEncoder', () => {
  let unitUnderTest: FixedWidthEncoder;

  beforeEach(() => {
    unitUnderTest = new FixedWidthEncoder(4, hexadecimal);
  });

  it('should reverse the encoding to get the decoding', () => {
    expect(unitUnderTest.encoding).toEqual(hexadecimal);
    expect(unitUnderTest.decoding).toEqual({
        0: '0',
        1: '1',
        2: '2',
        3: '3',
        4: '4',
        5: '5',
        6: '6',
        7: '7',
        8: '8',
        9: '9',
        10: 'A',
        11: 'B',
        12: 'C',
        13: 'D',
        14: 'E',
        15: 'F'
      });
  });

  it('should encode a single character correctly', () => {
    const decoded = 'A';
    const encoded = '1010';

    expect(unitUnderTest.encodeChar(decoded)).equal(encoded);
  });

  it('should encode a string correctly', () => {
    const decoded = 'A1B2';
    const encoded = '1010000110110010';

    expect(unitUnderTest.encodeText(decoded)).equal(encoded);
  });

  it('should decode a single character correctly', () => {
    const decoded = 'A';
    const encoded = '1010';

    expect(unitUnderTest.decodeChar(encoded)).equal(decoded);
  });

  it('should decode a string correctly', () => {
    const decoded = 'A1B2';
    const encoded = '1010000110110010';
    expect(unitUnderTest.decodeText(encoded)).equal(decoded);
  });

  describe('judgeBits', () => {
    it('should judge a single correct character', () => {
      const guess = '1010';
      const win = '1010';
      const judgment = unitUnderTest.judgeBits<SequenceJudgment>(guess, win);
      expect(judgment.isCorrect).toBe(true);
      expect(judgment.correctGuess).toBe(guess);
      expect(judgment.sequenceJudgments).toEqual([
        new SequenceJudgment(guess, "1111")
      ]);
    });

    it('should judge two correct display rows', () => {
      const guess = "11111110";
      const win = "11111110";
      const judgment = unitUnderTest.judgeBits<DisplayRowJudgment>(guess, win);
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
      const judgment = unitUnderTest.judgeBits<SequenceJudgment>(guess, win);
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
