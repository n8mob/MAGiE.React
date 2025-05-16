import { IndexedBit } from "../IndexedBit.ts";

enum Correctness {
  correct = 'correct',
  incorrect = 'incorrect',
  unguessed = 'unguessed',
  hidden = 'hidden',
}

class BitJudgment extends IndexedBit {
  private readonly _correctness: Correctness;

  get correctness(): Correctness {
    return this._correctness;
  }

  get isCorrect(): boolean {
    return this._correctness === Correctness.correct;
  }

  constructor(bitValue: IndexedBit, correctness: Correctness) {
    super(bitValue.bit, bitValue.index);
    this._correctness = correctness;
  }

  toString(): string {
    return `[${this.index}]: ${this.bit} ${this.correctness}`;
  }
}

export { BitJudgment, Correctness };

