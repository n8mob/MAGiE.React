import BitJudgment, {Correctness} from './BitJudgment';

export type Bits = string;
export type Chars = string;

export class SequenceJudgment {
  isSequenceCorrect: Correctness;
  guess: string;
  bitJudgments: BitJudgment[];

  constructor(guess: string, bitJudgments: string) {
    this.guess = guess;
    this.bitJudgments = [];
    for (let i = 0; i < this.guess.length; i++) {
      const judgment = new BitJudgment(this.guess[i], bitJudgments[i] == "1", i);
      this.bitJudgments.push(judgment);
    }

    this.isSequenceCorrect = this.bitJudgments.every(judgment => judgment.isCorrect);
  }

  toString(): string {
    return `(${this.isSequenceCorrect}, '${this.guess}', '${this.bitJudgments}')`;
  }

  [Symbol.iterator](): Iterator<BitJudgment> {
    let pointer = 0;
    const components = this.bitJudgments;

    return {
      next(): IteratorResult<BitJudgment> {
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

  equals(o: unknown): boolean {
    if (o instanceof SequenceJudgment) {
      return this.isSequenceCorrect === o.isSequenceCorrect &&
        this.guess === o.guess &&
        this.bitJudgments === o.bitJudgments;
    }
    return false;
  }

  hashCode(): number {
    return this.isSequenceCorrect.toString().length + this.guess.length + this.bitJudgments.length;
  }
}

export class CharJudgment extends SequenceJudgment {
  constructor(guess: string, bitJudgments: string) {
    super(guess, bitJudgments);
  }
}

export class DisplayRowJudgment extends SequenceJudgment {
  constructor(guess: string, bitJudgments: string) {
    super(guess, bitJudgments);
  }
}

