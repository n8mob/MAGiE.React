import { describe, expect, it } from "vitest";
import { IndexedBit } from "../../IndexedBit.ts";
import { BitJudgment, Correctness } from "../../judgment/BitJudgment.ts";

describe('BitJudgment', () => {
  it('should store correctness as correct', () => {
    const bit = new IndexedBit("1", 0);
    const judgment = new BitJudgment(bit, Correctness.correct);

    expect(judgment.correctness).to.equal(Correctness.correct);
    expect(judgment.isCorrect).to.be.true;
    expect(judgment.index).to.equal(bit.index);
    expect(judgment.bit).to.equal(bit.bit);
  });

  it('should store correctness as incorrect', () => {
    const bit = new IndexedBit("0", 1);
    const judgment = new BitJudgment(bit, Correctness.incorrect);

    expect(judgment.correctness).to.equal(Correctness.incorrect);
    expect(judgment.isCorrect).to.be.false;
    expect(judgment.index).to.equal(bit.index);
    expect(judgment.bit).to.equal(bit.bit);
  });

  it('should store correctness as unguessed', () => {
    const bit = new IndexedBit("1", 2);
    const judgment = new BitJudgment(bit, Correctness.unguessed);

    expect(judgment.correctness).to.equal(Correctness.unguessed);
    expect(judgment.isCorrect).to.be.false;
    expect(judgment.index).to.equal(bit.index);
    expect(judgment.bit).to.equal(bit.bit);
  });

  it('should store correctness as hidden', () => {
    const bit = new IndexedBit("0", 3);
    const judgment = new BitJudgment(bit, Correctness.hidden);

    expect(judgment.correctness).to.equal(Correctness.hidden);
    expect(judgment.isCorrect).to.be.false;
    expect(judgment.index).to.equal(bit.index);
    expect(judgment.bit).to.equal(bit.bit);
  });

  it('should return correct string from toString', () => {
    const bit = new IndexedBit("1", 4);
    const judgment = new BitJudgment(bit, Correctness.correct);

    expect(judgment.toString()).to.equal(`[4]: 1 correct`);
  });
});
