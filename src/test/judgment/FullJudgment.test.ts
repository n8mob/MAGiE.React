import { describe, expect, it } from 'vitest';
import { BitSequence } from "../../BitSequence.ts";
import { FullJudgment } from "../../judgment/FullJudgment.ts";
import { SequenceJudgment } from "../../judgment/SequenceJudgment.ts";

describe('FullJudgment.equals', () => {
  const bits101 = BitSequence.fromString('101');

  const allCorrect = '111';
  const allCorrect101 = new SequenceJudgment(bits101, allCorrect);

  const fj101AllCorrect = new FullJudgment(true, bits101, [allCorrect101]);

  it('returns true for identical FullJudgments', () => {
    const fj1 = fj101AllCorrect;
    const fj2 = new FullJudgment(true, bits101, [allCorrect101]);
    expect(fj1.equals(fj2)).to.be.true;
  });

  it('returns false if isCorrect differs', () => {
    const fj1 = fj101AllCorrect;
    const fj2 = new FullJudgment(false, BitSequence.fromString('101'), [allCorrect101]);
    expect(fj1.equals(fj2)).to.be.false;
  });

  it('returns false if correctGuess differs', () => {
    const fj1 = fj101AllCorrect;
    const fj2 = new FullJudgment(true, BitSequence.fromString('110'), [allCorrect101]);
    expect(fj1.equals(fj2)).to.be.false;
  });

  it('returns false if sequenceJudgments length differs', () => {
    const fj1 = new FullJudgment(true, bits101, [allCorrect101]);
    const fj2 = new FullJudgment(true, bits101, [allCorrect101, allCorrect101]);
    expect(fj1.equals(fj2)).to.be.false;
  });

  it('returns false if any sequenceJudgment is not equal', () => {
    const guess1 = BitSequence.fromString('11101');
    const seq1 = [new SequenceJudgment(guess1, '10111')];
    const fj1 = new FullJudgment(false, guess1, seq1);
    const guess2 = BitSequence.fromString('11110');
    const seq2 = [new SequenceJudgment(guess2, '10101')];
    const fj2 = new FullJudgment(false, guess2, seq2);
    expect(fj1.equals(fj2)).to.be.false;
  });
});
