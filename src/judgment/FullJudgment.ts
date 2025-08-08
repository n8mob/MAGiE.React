import { SequenceJudgment } from './SequenceJudgment.ts';
import { BitSequence } from "../BitSequence.ts";
import { IndexedBit } from "../IndexedBit.ts";

class FullJudgment {
  isCorrect: boolean;
  correctGuess: BitSequence;
  sequenceJudgments: SequenceJudgment[];

  constructor(
    isCorrect: boolean,
    correctGuess: BitSequence | IndexedBit[],
    sequenceJudgments: SequenceJudgment[]
  ) {
    this.isCorrect = isCorrect;
    this.correctGuess = new BitSequence(correctGuess);
    this.sequenceJudgments = sequenceJudgments;
  }

  * getCharJudgments() {
    for (const judgment of this.sequenceJudgments) {
      yield judgment;
    }
  }

  * getRowJudgments() {
    for (const judgment of this.sequenceJudgments) {
      yield judgment;
    }
  }

  equals(that: FullJudgment): boolean {
    if (this.isCorrect !== that.isCorrect) {
      return false;
    }

    if (!this.correctGuess.equals(that.correctGuess)) {
      return false;
    }

    if (this.sequenceJudgments.length !== that.sequenceJudgments.length) {
      return false;
    }

    for (let i = 0; i < this.sequenceJudgments.length; i++) {
      if (!this.sequenceJudgments[i].equals(that.sequenceJudgments[i])) {
        return false;
      }
    }
    return true;
  }
}

export { FullJudgment };
