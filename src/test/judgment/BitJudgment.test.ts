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
});
