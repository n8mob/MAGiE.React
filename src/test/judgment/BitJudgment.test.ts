import { describe, expect, it } from "vitest";
import { IndexedBit } from "../../IndexedBit.ts";
import { BitJudgment } from "../../judgment/BitJudgment.ts";

describe('BitJudgment', () => {
  it('should store a correct "on" bit', () => {
    const onBit = new IndexedBit("1", 0);
    const judgment = BitJudgment.judge(onBit, onBit);

    expect(judgment.isCorrect).to.equal(true);
    expect(judgment.index).to.equal(onBit.index);
    expect(judgment.bit).to.equal(onBit.bit);
  });

  it('should store a correct "off" bit', () => {
    const offBit = new IndexedBit("0", 76);
    const judgment = BitJudgment.judge(offBit, offBit);

    expect(judgment.isCorrect).to.equal(true);
    expect(judgment.index).to.equal(offBit.index);
    expect(judgment.bit).to.equal(offBit.bit); // aha!
  });

  it('should store an incorrect bit when guessBit is missing', () => {
    const winBit = new IndexedBit("1", 2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const judgment = BitJudgment.judge(undefined as any, winBit);
    expect(judgment.isCorrect).to.equal(false);
    expect(judgment.index).to.equal(winBit.index);
    expect(judgment.bit).to.equal(winBit.bit);
  });

  it('should store an incorrect bit when winBit is missing', () => {
    const guessBit = new IndexedBit("0", 3);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const judgment = BitJudgment.judge(guessBit, undefined as any);
    expect(judgment.isCorrect).to.equal(false);
    expect(judgment.index).to.equal(guessBit.index);
    expect(judgment.bit).to.equal(guessBit.bit);
  });

  it('should judgeCorrect accurately', () => {
    const bit = new IndexedBit("1", 5);
    const judgment = BitJudgment.judgeCorrect(bit);
    expect(judgment.isCorrect).to.equal(true);
    expect(judgment.index).to.equal(bit.index);
    expect(judgment.bit).to.equal(bit.bit);
  });

  it('should judgeIncorrect accurately', () => {
    const bit = new IndexedBit("0", 6);
    const judgment = BitJudgment.judgeIncorrect(bit);
    expect(judgment.isCorrect).to.equal(false);
    expect(judgment.index).to.equal(bit.index);
    expect(judgment.bit).to.equal(bit.bit);
  });

  it('should return correct string from toString for correct', () => {
    const bit = new IndexedBit("1", 7);
    const judgment = BitJudgment.judgeCorrect(bit);
    expect(judgment.toString()).to.include("is correct");
  });

  it('should return correct string from toString for incorrect', () => {
    const bit = new IndexedBit("0", 8);
    const judgment = BitJudgment.judgeIncorrect(bit);
    expect(judgment.toString()).to.include("is incorrect");
  });
});

