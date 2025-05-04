import { describe, it, beforeEach, expect } from 'vitest';
import { FixedWidthDecodingJudge } from '../../judgment/FixedWidthDecodingJudge';
import { FixedWidthEncoder } from '../../encoding/FixedWidthEncoder';
import { BitSequence } from '../../BitSequence';
import { SplitterFunction } from "../../judgment/BinaryJudge.ts";

const HEX_WIDTH = 4;
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

describe('FixedWidthDecodingJudge', () => {
  let unitUnderTest: FixedWidthDecodingJudge;

  const split: SplitterFunction = function* (bits: BitSequence) {
    let b2: BitSequence = bits;
    const sliceWidth = HEX_WIDTH;
    let sliceCount = 1;
    while (b2 && b2.length > 0) {
      const slice: BitSequence = b2.slice(0, sliceWidth * sliceCount++);
      yield slice;
      b2 = b2.slice(sliceWidth);
    }
  }

  beforeEach(() => {
    unitUnderTest = new FixedWidthDecodingJudge(new FixedWidthEncoder(HEX_WIDTH, hexadecimal));
  });

  it('should judge a single correct character', () => {
    const guess = BitSequence.fromString('1010');
    const win = BitSequence.fromString('1010');
    const result = unitUnderTest.judgeBits(guess, win, split);
    expect(result.correctGuess.toPlainString()).to.equal('1010');
    expect(result.isCorrect).to.be.true;
  });

  it('should judge an incorrect character', () => {
    const guess = BitSequence.fromString('1010');
    const win = BitSequence.fromString('1111');
    const result = unitUnderTest.judgeBits(guess, win, split);
    expect(result.isCorrect).to.be.false;
  });

  it('should judge text correctly', () => {
    const result = unitUnderTest.judgeText('A', 'A');
    expect(result.isCorrect).to.be.true;
  });

  it('should judge text as incorrect', () => {
    const result = unitUnderTest.judgeText('A', 'B');
    expect(result.isCorrect).to.be.false;
  });
});
