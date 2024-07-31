import BinaryJudge from "./BinaryJudge.ts";
import FullJudgment from "./FullJudgment.ts";
import {SequenceJudgment, CharJudgment} from "./SequenceJudgment.ts";
import FixedWidthEncoder from "./FixedWidthEncoder.ts";

export default class FixedWidthEncodingJudge implements BinaryJudge {
  public readonly encoder: FixedWidthEncoder;

  constructor(encoder: FixedWidthEncoder) {
    this.encoder = encoder;
  }

  _judgeBits<T extends SequenceJudgment>(
    guessBits: string,
    winBits: string,
    newSequenceJudgment: (bits: string, judgments: string) => T = (bits, judgments) => new SequenceJudgment(
      bits,
      judgments
    ) as T
  ): FullJudgment<T> {
    const sequenceJudgments: T[] = [];
    const guessSplit = this.encoder.splitByChar(guessBits);
    const winSplit = this.encoder.splitByChar(winBits);
    let nextGuess = guessSplit.next();
    let nextWin = winSplit.next();

    let allCorrect = true;
    const correctBits: string[] = [];

    while (!nextGuess.done) {
      const sequenceGuessBits = nextGuess.value;
      if (nextWin.done) {
        allCorrect = false;
        sequenceJudgments.push(newSequenceJudgment(sequenceGuessBits, "0".repeat(sequenceGuessBits.length)));
        nextGuess = guessSplit.next();
      } else {
        const sequenceWinBits = nextWin.value;
        const bitJudgments: string[] = [];
        [...sequenceWinBits].map((bit, index) => {
          const bitIsCorrect = bit === sequenceGuessBits[index];
          if (allCorrect) {
            if (bitIsCorrect) {
              correctBits.push(bit);
            } else {
              allCorrect = false;
            }
          }
          bitJudgments.push(bitIsCorrect ? "1" : "0");
        });
        sequenceJudgments.push(newSequenceJudgment(sequenceGuessBits, bitJudgments.join("")));
      }

      nextGuess = guessSplit.next();
      nextWin = winSplit.next();
    }

    return new FullJudgment<T>(allCorrect, correctBits.join(''), sequenceJudgments);
  }

  judgeBits<T extends SequenceJudgment>(
    guessBits: string,
    winBits: string
  ) {
    return this._judgeBits<T>(guessBits, winBits);
  }

  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment> {
    const guessBits = this.encoder.encodeText(guessText);
    const winBits = this.encoder.encodeText(winText);
    const newCharJudgment = (bits: string, bitJudgments: string) => new CharJudgment(bits, bitJudgments);
    return this._judgeBits<CharJudgment>(
      guessBits,
      winBits,
      newCharJudgment
    );
  }
}
