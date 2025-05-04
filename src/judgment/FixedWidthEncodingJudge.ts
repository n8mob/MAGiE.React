import { BinaryJudge, SplitterFunction } from "./BinaryJudge.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { CharJudgment, SequenceJudgment } from "./SequenceJudgment.ts";
import { FixedWidthEncoder } from "../encoding/FixedWidthEncoder.ts";
import { BitSequence } from "../BitSequence.ts";
import { BitJudgment } from "./BitJudgment.ts";

class FixedWidthEncodingJudge implements BinaryJudge {
  public readonly encoder: FixedWidthEncoder;

  constructor(encoder: FixedWidthEncoder) {
    this.encoder = encoder;
  }

  judgeBits<T extends SequenceJudgment>(
    guessBits: BitSequence,
    winBits: BitSequence,
    split: SplitterFunction,
    newSequenceJudgment: (bits: BitSequence, judgments: string) => T =
    (bits, judgments) => new CharJudgment(bits, judgments) as T
  ): FullJudgment<T> {
    const allSequenceJudgments: T[] = [];
    const guessSplit = split(guessBits);
    const winSplit = split(winBits);
    let nextGuess = guessSplit.next();
    let nextWin = winSplit.next();

    let allCorrect = true;
    const correctBits = BitSequence.empty();

    while (!nextWin.done) {
      const sequenceWinBits = nextWin.value;

      if (nextGuess.done) {
        allCorrect = false;
        allSequenceJudgments.push(newSequenceJudgment(sequenceWinBits, "0".repeat(sequenceWinBits.length)));
        nextWin = winSplit.next();
        continue; // guess is done, don't advance it
      }

      const sequenceGuessBits: BitSequence = nextGuess.value;
      const sequenceBitJudgments: BitJudgment[] = [];
      for (const winBit of sequenceWinBits) {
        const bitJudgment = BitJudgment.judge(winBit, sequenceGuessBits.getBitByGlobalIndex(winBit.index));
        if (bitJudgment.isCorrect) {
          correctBits.appendBits(winBit.bit?.toString() || "0");
        } else {
          allCorrect = false;
        }
        sequenceBitJudgments.push(bitJudgment);
      }

      allSequenceJudgments.push(new SequenceJudgment(sequenceGuessBits, sequenceBitJudgments));

      nextGuess = guessSplit.next();
      nextWin = winSplit.next();
    }

    while (!nextGuess.done) {
      allCorrect = false; // the guess is too long, can't be right.
      const sequenceGuessBits = nextGuess.value;
      allSequenceJudgments.push(newSequenceJudgment(sequenceGuessBits, "0".repeat(sequenceGuessBits.length)));
      nextGuess = guessSplit.next();
    }

    return new FullJudgment<T>(allCorrect, new BitSequence(correctBits), allSequenceJudgments);
  }

  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment> {
    const guessBits = this.encoder.encodeText(guessText);
    const winBits = this.encoder.encodeText(winText);
    const newCharJudgment = (bits: BitSequence, bitJudgments: string) => {
      return new CharJudgment(bits, bitJudgments);
    }

    return this.judgeBits<CharJudgment>(
      guessBits,
      winBits,
      (bits) => this.encoder.splitByChar(bits),
      newCharJudgment
    );
  }
}

export { FixedWidthEncodingJudge };
