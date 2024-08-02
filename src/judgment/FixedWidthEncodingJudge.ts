import BinaryJudge, {SplitterFunction} from "./BinaryJudge.ts";
import FullJudgment from "./FullJudgment.ts";
import {SequenceJudgment, CharJudgment} from "./SequenceJudgment.ts";
import FixedWidthEncoder from "../encoding/FixedWidthEncoder.ts";
import {DisplayRow} from "../encoding/BinaryEncoder.ts";

export default class FixedWidthEncodingJudge implements BinaryJudge {
  public readonly encoder: FixedWidthEncoder;

  constructor(encoder: FixedWidthEncoder) {
    this.encoder = encoder;
  }

  judgeBits<T extends SequenceJudgment>(
    guessBits: string,
    winBits: string,
    split: SplitterFunction,
    newSequenceJudgment: (bits: string, judgments: string) => T =
      (bits, judgments) => new CharJudgment(bits, judgments) as T
  ): FullJudgment<T> {
    const sequenceJudgments: T[] = [];
    const guessSplit = split(guessBits);
    const winSplit = split(winBits);
    let nextGuess = guessSplit.next();
    let nextWin = winSplit.next();

    let allCorrect = true;
    const correctBits: string[] = [];

    while (!nextGuess.done) {
      let sequenceGuessBits: string;
      if (nextGuess.value instanceof DisplayRow) {
        sequenceGuessBits = nextGuess.value.bits;
      } else {
        sequenceGuessBits = nextGuess.value;
      }

      if (nextWin.done) {
        allCorrect = false;
        sequenceJudgments.push(newSequenceJudgment(sequenceGuessBits, "0".repeat(sequenceGuessBits.length)));
        nextGuess = guessSplit.next();
      } else {
        let sequenceWinBits: string;
        if (nextWin.value instanceof DisplayRow) {
          sequenceWinBits = nextWin.value.bits;
        } else {
          sequenceWinBits = nextWin.value;
        }
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

  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment> {
    const guessBits = this.encoder.encodeText(guessText);
    const winBits = this.encoder.encodeText(winText);
    const newCharJudgment = (bits: string, bitJudgments: string) => new CharJudgment(bits, bitJudgments);
    return this.judgeBits<CharJudgment>(
      guessBits,
      winBits,
      (bits) => this.encoder.splitByChar(bits),
      newCharJudgment
    );
  }
}
