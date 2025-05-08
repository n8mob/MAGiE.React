import { VariableWidthEncoder } from "../encoding/VariableWidthEncoder.ts";
import { CharJudgment, DisplayRowJudgment, SequenceJudgment } from "./SequenceJudgment.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { BinaryJudge, SplitterFunction } from "./BinaryJudge.ts";
import { IndexedBit } from "../IndexedBit.ts";
import { BitSequence } from "../BitSequence.ts";

class VariableWidthDecodingJudge implements BinaryJudge {
  private encoder: VariableWidthEncoder;

  constructor(encoder: VariableWidthEncoder) {
    this.encoder = encoder;
  }

  _judgeBits<T extends SequenceJudgment>(
    guessBits: BitSequence,
    winBits: BitSequence,
    splitter: SplitterFunction,
    newSequenceJudgment: (bits: IndexedBit[] | BitSequence, judgments: string) => T = (
      bits,
      judgments
    ) => new SequenceJudgment(
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
    let correctBits = BitSequence.empty();

    while (!nextWin.done) {
      if (nextGuess.done) {
        allCorrect = false;
        sequenceJudgments.push(newSequenceJudgment(nextWin.value, "0".repeat(nextWin.value.length)));
        nextWin = winSplit.next();
        continue; // guess is over, but there are more win bits, so they need to be judged as incorrect.
      }

      let bitJudgments: string = "";
      if (nextWin.value.equals(nextGuess.value)) {
        bitJudgments = "1".repeat(nextWin.value.length);
        correctBits = correctBits.appendBits(nextGuess.value);
      } else {
        allCorrect = false;
        for (const winBit of nextWin.value) {
          bitJudgments += winBit.equals(nextGuess.value.getBitByGlobalIndex(winBit.index)) ? "1" : "0";
        }
      }
      sequenceJudgments.push(newSequenceJudgment(nextWin.value, bitJudgments));
      nextGuess = guessSplit.next();
      nextWin = winSplit.next();
    }

    return new FullJudgment<T>(allCorrect, correctBits, sequenceJudgments);
  }

  judgeBits<T extends DisplayRowJudgment>(
    guessBits: BitSequence,
    winBits: BitSequence,
    splitter: SplitterFunction
  ): FullJudgment<T> {
    return this._judgeBits(
      guessBits,
      winBits,
      splitter,
      (bits, judgments) => new SequenceJudgment(bits, judgments) as T
    );
  }

  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment> {
    const guessBits = this.encoder.encodeText(guessText);
    const winBits = this.encoder.encodeText(winText);

    const newCharJudgment = (bits: BitSequence | IndexedBit[], judgments: string) => new CharJudgment(bits, judgments);
    const splitter = (bits: BitSequence) => this.encoder.splitByChar(bits);
    return this._judgeBits(
      guessBits,
      winBits,
      splitter,
      newCharJudgment
    );
  }
}

export { VariableWidthDecodingJudge };
