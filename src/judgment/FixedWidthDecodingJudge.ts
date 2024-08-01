import BinaryJudge, {SplitterFunction} from "./BinaryJudge.ts";
import FullJudgment from "./FullJudgment.ts";
import {CharJudgment, SequenceJudgment} from "./SequenceJudgment.ts";
import FixedWidthEncoder from "../encoding/FixedWidthEncoder.ts";
import {DisplayRow} from "../encoding/BinaryEncoder.ts";

export default class FixedWidthDecodingJudge implements BinaryJudge {
  encoder: FixedWidthEncoder;

  constructor(encoder: FixedWidthEncoder) {
    this.encoder = encoder;
  }

  judgeBits<T extends SequenceJudgment>(
    guessBits: string,
    winBits: string,
    splitter: SplitterFunction,
    newSequenceJudgment: (bits: string, judgments: string) => T =
      (bits, judgments) => new SequenceJudgment(bits, judgments) as T
  ): FullJudgment<T> {
    if (!splitter) {
      throw new Error("Splitter must be provided");
    }

    const sequenceJudgments: T[] = []
    const guessSplit = splitter(guessBits);
    const winSplit = splitter(winBits);
    let nextGuess = guessSplit.next();
    let nextWin = winSplit.next();

    let allCorrect = true;
    let correctBits = "";

    while (!nextWin.done) {
      let sequenceWinBits: string;
      if (nextWin.value instanceof DisplayRow) {
        sequenceWinBits = nextWin.value.bits;
      } else {
        sequenceWinBits = nextWin.value;
      }

      if (nextGuess.done) {
        allCorrect = false;
        sequenceJudgments.push(newSequenceJudgment("", "0".repeat(sequenceWinBits.length)));
        nextWin = winSplit.next();
      } else {
        let sequenceGuessBits: string;
        if (nextGuess.value instanceof DisplayRow) {
          sequenceGuessBits = nextGuess.value.bits;
        } else {
          sequenceGuessBits = nextGuess.value;
        }

        let bitJudgments: string;
        if (sequenceWinBits === sequenceGuessBits) {
          bitJudgments = "1".repeat(sequenceWinBits.length);
          correctBits += sequenceGuessBits;
        } else {
          bitJudgments = [...sequenceWinBits].map((
            winBit: string,
            index: number
          ) => winBit === sequenceGuessBits[index] ? "1" : "0")
            .join("");
          allCorrect = false;
        }
        sequenceJudgments.push(newSequenceJudgment(sequenceGuessBits, bitJudgments));
        nextWin = winSplit.next();
        nextGuess = guessSplit.next();
      }
    }

    return new FullJudgment<T>(allCorrect, correctBits, sequenceJudgments);
  }

  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment> {
    const guessBits = this.encoder.encodeText(guessText);
    const winBits = this.encoder.encodeText(winText);

    const splitter = (bits: string) => this.encoder.splitByChar(bits);
    return this.judgeBits(
      guessBits,
      winBits,
      splitter
    );
  }
}
