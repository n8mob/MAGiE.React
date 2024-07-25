import {SequenceJudgment} from './SequenceJudgment.ts';

class FullJudgment<T extends SequenceJudgment> {
  isCorrect: boolean;
  correctGuess: string;
  sequenceJudgments: T[];

  constructor(
    isCorrect: boolean,
    correctGuess: string,
    sequenceJudgments: T[]
    ) {
    this.isCorrect = isCorrect;
    this.correctGuess = correctGuess;
    this.sequenceJudgments = sequenceJudgments;
  }

  getCharJudgments() {
    let pointer = 0;
    const components = this.sequenceJudgments;

    return {
      next(): IteratorResult<SequenceJudgment> {
        if (pointer < components.length) {
          return {
            done: false,
            value: components[pointer++],
          };
        } else {
          return {
            done: true,
            value: null,
          };
        }
      },
    };
  }

  getRowJudgments() {
    let pointer = 0;
    const components = this.sequenceJudgments;

    return {
      next(): IteratorResult<SequenceJudgment> {
        if (pointer < components.length) {
          return {
            done: false,
            value: components[pointer++],
          };
        } else {
          return {
            done: true,
            value: null,
          };
        }
      },
    };
  }
}

export default FullJudgment;
