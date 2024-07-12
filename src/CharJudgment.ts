export type Bits = string;
export type Chars = string;

export default class CharJudgment<T extends Bits | Chars> {
  isCharCorrect: boolean;
  guess: T;
  bitJudgments: Bits;

  constructor(isCharCorrect: boolean, guess: T, bitJudgments: Bits) {
    this.isCharCorrect = isCharCorrect;
    this.guess = guess;
    this.bitJudgments = bitJudgments;
  }

  toString(): string {
    return `(${this.isCharCorrect}, '${this.guess}', '${this.bitJudgments}')`;
  }

  equals(o: unknown): boolean {
    if (o instanceof CharJudgment) {
      return this.isCharCorrect === o.isCharCorrect &&
        this.guess === o.guess &&
        this.bitJudgments === o.bitJudgments;
    }
    return false;
  }

  hashCode(): number {
    return this.isCharCorrect.toString().length + this.guess.length + this.bitJudgments.length;
  }
}
