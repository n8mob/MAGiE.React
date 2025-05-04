import { BinaryJudge, SplitterFunction } from "./BinaryJudge.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { CharJudgment, SequenceJudgment } from "./SequenceJudgment.ts";
import { FixedWidthEncoder } from "../encoding/FixedWidthEncoder.ts";
import { BitSequence } from "../BitSequence.ts";
import { IndexedBit } from "../IndexedBit.ts";

class FixedWidthDecodingJudge implements BinaryJudge {
  encoder: FixedWidthEncoder;

  constructor(encoder: FixedWidthEncoder) {
    this.encoder = encoder;
  }

  judgeBits<T extends SequenceJudgment>(
    guessBits: BitSequence,
    winBits: BitSequence,
    splitter: SplitterFunction,
    newSequenceJudgment: (bits: BitSequence, judgments: string) => T =
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
    let correctBits = BitSequence.empty();

    while (!nextGuess.done) {
      const sequenceGuessBits: BitSequence = nextGuess.value;

      if (nextWin.done) {
        allCorrect = false;
        sequenceJudgments.push(newSequenceJudgment(sequenceGuessBits, "0".repeat(sequenceGuessBits.length)));
        nextWin = winSplit.next();
        continue; // guess is done, continue loop to display incorrectly guessed win bits.
      }

      const sequenceWinBits = nextWin.value;
      let bitJudgments: string;
      if (sequenceGuessBits.equals(sequenceWinBits)) {
        bitJudgments = "1".repeat(sequenceWinBits.length);
        correctBits = correctBits.appendBits(sequenceGuessBits);
      } else {
        bitJudgments = [...sequenceGuessBits]
          .map((guessBit: IndexedBit, index: number) => guessBit.equals(sequenceWinBits[index]) ? "1" : "0")
          .join("");
        allCorrect = false;
      }
      sequenceJudgments.push(newSequenceJudgment(sequenceGuessBits, bitJudgments));
      nextWin = winSplit.next();
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

export { FixedWidthDecodingJudge };
