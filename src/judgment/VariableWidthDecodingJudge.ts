import VariableWidthEncoder from "../encoding/VariableWidthEncoder.ts";
import {CharJudgment, DisplayRowJudgment, SequenceJudgment} from "./SequenceJudgment.ts";
import FullJudgment from "./FullJudgment.ts";
import {DisplayRow} from "../encoding/BinaryEncoder.ts";
import BinaryJudge, {SplitterFunction} from "./BinaryJudge.ts";

export default class VariableWidthDecodingJudge implements BinaryJudge {
  private encoder: VariableWidthEncoder;
  constructor(encoder: VariableWidthEncoder) {
    this.encoder = encoder;
  }

  _judgeBits<T extends SequenceJudgment>(
    guessBits: string,
    winBits: string,
    splitter: SplitterFunction,
    newSequenceJudgment: (bits: string, judgments: string) => T = (bits, judgments) => new SequenceJudgment(
      bits,
      judgments
    ) as T
  ): FullJudgment<T> {
    const sequenceJudgments: T[] = [];
    const guessSplit = splitter(guessBits);
    const winSplit = splitter(winBits);
    let nextGuess = guessSplit.next();
    let nextWin = winSplit.next();

    let allCorrect = true;
    let correctBits = "";

    while(!nextWin.done) {
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

  judgeBits<T extends DisplayRowJudgment>(
    guessBits: string,
    winBits: string,
    splitter: SplitterFunction
  ): FullJudgment<T> {
    return this._judgeBits(
      guessBits,
      winBits,
      splitter,
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
