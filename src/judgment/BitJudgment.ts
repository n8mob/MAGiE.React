import { IndexedBit } from "../IndexedBit.ts";

type Correctness = true | false | "unknown";

class BitJudgment extends IndexedBit {
  private readonly _isCorrect: Correctness = "unknown";

  get isCorrect(): Correctness {
    return this._isCorrect;
  }

  /**
   * Recommend using {@link BitJudgment.judge} or {@link BitJudgment.judgeCorrect} or {@link BitJudgment.judgeIncorrect} factory methods.
   * This raw constructor expects an IndexedBit and a correctness value.
   * @param bitValue
   * @param isCorrect
   */
  constructor(bitValue: IndexedBit, isCorrect: Correctness) {
    super(bitValue.bit, bitValue.index);
    this._isCorrect = isCorrect;
  }

  toString(): string {
    return `[${this.index}]: ${this.bit} ${this._isCorrect ? "is correct" : "is incorrect"}`;
  }

  static judge(guessBit: IndexedBit, winBit: IndexedBit): BitJudgment {
    if (!guessBit) {
      return BitJudgment.judgeIncorrect(winBit)
    } else if (!winBit) {
      return BitJudgment.judgeIncorrect(guessBit)
    }

    const correctness = guessBit.equals(winBit);
    return new BitJudgment(guessBit, correctness);
  }

  static judgeCorrect(bit: IndexedBit): BitJudgment {
    return new BitJudgment(bit, true);
  }

  static judgeIncorrect(bit: IndexedBit): BitJudgment {
    return new BitJudgment(bit, false);
  }
}

export { BitJudgment };
export type { Correctness };

