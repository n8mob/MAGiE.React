import { BinaryJudge, SplitterFunction } from "./BinaryJudge.ts";
import { CharJudgment, SequenceJudgment } from "./SequenceJudgment.ts";
import { VariableWidthEncoder } from "../encoding/VariableWidthEncoder.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { BitSequence } from "../BitSequence.ts";

class VariableWidthEncodingJudge implements BinaryJudge {
  public readonly encoder: VariableWidthEncoder;

  constructor(encoder: VariableWidthEncoder) {
    this.encoder = encoder;
  }

  judgeBits<T extends SequenceJudgment>(
    guessBits: BitSequence,
    winBits: BitSequence,
    split: SplitterFunction,
    newSequenceJudgment: (bits: BitSequence, judgments: string) => T = (
      bits,
      judgments
    ) => new CharJudgment(bits, judgments) as T
  ): FullJudgment<T> {
    const sequenceJudgments: T[] = [];
    const guessSplit = split(guessBits);
    const winSplit = split(winBits);
    let nextGuess = guessSplit.next();
    let nextWin = winSplit.next();

    let allCorrect = true;
    let correctBits = BitSequence.empty();

    const judgeGuessAgainstWin = (guess: BitSequence, win: BitSequence): T => {
      let bitJudgments: string;
      if (guess.equals(win)) {
        bitJudgments = "1".repeat(guess.length);
        if (correctBits.endsWith(guess.firstBit()) && !guess.startsWith(this.encoder.characterSeparator)) {
          correctBits = correctBits.appendBits(this.encoder.characterSeparator);
          bitJudgments += "1";
        }
        correctBits = correctBits.appendBits(guess);
      } else {
        bitJudgments = [...win].map((winBit) => {
          return winBit.equals(guess.getBitByGlobalIndex(winBit.index)) ? "1" : "0";
        }).join("");
        allCorrect = false;
      }
      return newSequenceJudgment(guess, bitJudgments);
    };

    while (!nextWin.done) {
      const win = nextWin.value;

      if (nextGuess.done) {
        allCorrect = false;
        sequenceJudgments.push(newSequenceJudgment(win, "0".repeat(win.length)));
        nextWin = winSplit.next();
        continue;
      }

      const sequenceJudgment = judgeGuessAgainstWin(nextGuess.value, win);
      sequenceJudgments.push(sequenceJudgment);

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

  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment> {
    const guessBits = this.encoder.encodeText(guessText);
    const winBits = this.encoder.encodeText(winText);

    const splitter = (bits: BitSequence) => this.encoder.splitByChar(bits);
    return this.judgeBits(
      guessBits,
      winBits,
      splitter
    );
  }
}

export { VariableWidthEncodingJudge };
