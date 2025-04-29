import { BinaryJudge, SplitterFunction } from "./BinaryJudge.ts";
import { CharJudgment, DisplayRowJudgment, SequenceJudgment } from "./SequenceJudgment.ts";
import { VariableWidthEncoder } from "../encoding/VariableWidthEncoder.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { BitSequence } from "../BitSequence.ts";

class VariableWidthEncodingJudge implements BinaryJudge {
  public readonly encoder: VariableWidthEncoder;

  constructor(encoder: VariableWidthEncoder) {
    this.encoder = encoder;
  }

  _judgeBits<T extends SequenceJudgment>(
    guessBits: BitSequence,
    winBits: BitSequence,
    split: SplitterFunction,
    newSequenceJudgment: (bits: BitSequence, judgments: string) => T = (
      bits,
      judgments
    ) => new SequenceJudgment(bits, judgments) as T
  ): FullJudgment<T> {
    const sequenceJudgments: T[] = [];
    const guessSplit = split(guessBits);
    const winSplit = split(winBits);
    let nextGuess = guessSplit.next();
    let nextWin = winSplit.next();

    let allCorrect = true;
    let correctBits = BitSequence.empty();

    while (!nextWin.done) {
      if (nextGuess.done) {
        allCorrect = false;
        sequenceJudgments.push(newSequenceJudgment(nextWin.value, "0".repeat(nextWin.value.length)));
        nextWin = winSplit.next();
        continue;
      }
      let bitJudgments: string;
      if (nextGuess.value.equals(nextWin.value)) {
        bitJudgments = "1".repeat(nextGuess.value.length);
        if (correctBits.endsWith(nextGuess.value.firstBit()) && !nextGuess.value.startsWith(this.encoder.characterSeparator)) {
          correctBits = correctBits.appendBits(this.encoder.characterSeparator);
          bitJudgments += "1";
        }
        correctBits = correctBits.appendBits(nextGuess.value);
      } else {
        bitJudgments = [...nextWin.value].map((winBit) => {
          return winBit.equals(nextGuess.value.getBitByGlobalIndex(winBit.index)) ? "1" : "0";
        }).join("");
        allCorrect = false;
      }
      sequenceJudgments.push(newSequenceJudgment(nextGuess.value, bitJudgments));
      nextGuess = guessSplit.next();
      nextWin = winSplit.next();
    }

    // Handle extra guesses after winBits are exhausted
    while (!nextGuess.done) {
      allCorrect = false;
      sequenceJudgments.push(newSequenceJudgment(nextGuess.value, "0".repeat(nextGuess.value.length)));
      nextGuess = guessSplit.next();
    }

    return new FullJudgment<T>(allCorrect, correctBits, sequenceJudgments);
  }

  judgeBits<T extends SequenceJudgment>(
    guessBits: BitSequence,
    winBits: BitSequence,
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

    const newCharJudgment = (bits: BitSequence, judgments: string) => new CharJudgment(bits, judgments);
    const splitter = (bits: BitSequence) => this.encoder.splitByChar(bits);
    return this._judgeBits(
      guessBits,
      winBits,
      splitter,
      newCharJudgment
    );
  }
}

export { VariableWidthEncodingJudge };
