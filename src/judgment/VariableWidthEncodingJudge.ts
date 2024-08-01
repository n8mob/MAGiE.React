import BinaryJudge, {SplitterFunction} from "./BinaryJudge.ts";
import {CharJudgment, DisplayRowJudgment, SequenceJudgment} from "./SequenceJudgment.ts";
import VariableWidthEncoder from "../encoding/VariableWidthEncoder.ts";
import FullJudgment from "./FullJudgment.ts";
import {DisplayRow} from "../encoding/BinaryEncoder.ts";

export default class VariableWidthEncodingJudge implements BinaryJudge {
  public readonly encoder: VariableWidthEncoder;

  constructor(encoder: VariableWidthEncoder) {
    this.encoder = encoder;
  }

  _judgeBits<T extends SequenceJudgment>(
    guessBits: string,
    winBits: string,
    split: SplitterFunction,
    newSequenceJudgment: (bits: string, judgments: string) => T = (bits, judgments) => new SequenceJudgment(
      bits,
      judgments
    ) as T
  ): FullJudgment<T> {
    const sequenceJudgments: T[] = [];
    const guessSplit = split(guessBits);
    const winSplit = split(winBits);
    let nextGuess = guessSplit.next();
    let nextWin = winSplit.next();

    let allCorrect = true;
    let correctBits = "";
    let lastCorrectBit = "";

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

        let bitJudgments: string;
        if (sequenceWinBits === sequenceGuessBits) {
          bitJudgments = "1".repeat(sequenceGuessBits.length);
          if (lastCorrectBit !== "") {
            if (lastCorrectBit === sequenceGuessBits[sequenceGuessBits.length - 1] && sequenceGuessBits !== this.encoder.characterSeparator) {
              correctBits += this.encoder.characterSeparator;
            }
          }
          correctBits += sequenceGuessBits;
          lastCorrectBit = sequenceGuessBits[sequenceGuessBits.length - 1];
        } else {
          bitJudgments = [...sequenceWinBits].map((winBit, index) => winBit === sequenceGuessBits[index] ? "1" : "0")
            .join("");
          allCorrect = false;
        }
        sequenceJudgments.push(newSequenceJudgment(sequenceGuessBits, bitJudgments));
        nextGuess = guessSplit.next();
        nextWin = winSplit.next();
      }
    }

    return new FullJudgment<T>(allCorrect, correctBits, sequenceJudgments);
  }

  judgeBits<T extends SequenceJudgment>(
    guessBits: string,
    winBits: string,
    split: SplitterFunction
  ): FullJudgment<T> {
    return this._judgeBits(
      guessBits,
      winBits,
      split,
      (bits, judgments) => new DisplayRowJudgment(bits, judgments) as T
    );
  }

  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment> {
    const guessBits = this.encoder.encodeText(guessText);
    const winBits = this.encoder.encodeText(winText);

    const newCharJudgment = (bits: string, judgments: string) => new CharJudgment(bits, judgments);
    const splitter = (bits: string) => this.encoder.splitByChar(bits);
    return this._judgeBits(
      guessBits,
      winBits,
      splitter,
      newCharJudgment
    );
  }
}
