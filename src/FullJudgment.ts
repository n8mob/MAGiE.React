import CharJudgment, {Bits, Chars} from './CharJudgment';

class FullJudgment<T extends Bits | Chars> {
  isCorrect: boolean;
  correctBits: T;
  charJudgments: CharJudgment<T>[];

  constructor(isCorrect: boolean, correctGuess: T, charJudgments: CharJudgment<T>[] | null = null) {
    this.isCorrect = isCorrect;
    this.correctBits = correctGuess;
    this.charJudgments = charJudgments ? charJudgments : [];
  }

  [Symbol.iterator](): Iterator<CharJudgment<T>> {
    let pointer = 0;
    const components = this.charJudgments;

    return {
      next(): IteratorResult<CharJudgment<T>> {
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
