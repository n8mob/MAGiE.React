import { CharJudgment, SequenceJudgment } from "./SequenceJudgment.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { BitSequence } from "../BitSequence.ts";
import { BitJudgment } from "./BitJudgment.ts";
import { IndexedBit } from "../IndexedBit.ts";

type SplitterFunction = (bits: BitSequence) => Generator<BitSequence, void>;
type NewSequenceJudgment<T extends SequenceJudgment> = (bits: BitSequence, judgments: string | BitJudgment[]) => T;
type BitJudge = (guessBit?: IndexedBit, winBit?: IndexedBit) => BitJudgment;

interface BinaryJudge {
  judgeBits<T extends SequenceJudgment>(
    guessBits: BitSequence,
    winBits: BitSequence,
    split: SplitterFunction,
    bitJudge?: BitJudge,
    newSequenceJudgment?: NewSequenceJudgment<T>
  ): FullJudgment<T>;

  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment>;
}

abstract class BaseBinaryJudge implements BinaryJudge {
  judgeBits<T extends SequenceJudgment>(
    guessBits: BitSequence,
    winBits: BitSequence,
    split: SplitterFunction,
    bitJudge: BitJudge,
    newSequenceJudgment: NewSequenceJudgment<T>
  ): FullJudgment<T> {
    const sequenceJudgments: T[] = [];
    const guessSplit = split(guessBits);
    const winSplit = split(winBits);
    let nextGuess = guessSplit.next();
    let nextWin = winSplit.next();
    let allCorrect = true;
    const correctBits: IndexedBit[] = [];

    while (!nextWin.done) {
      if (nextGuess.done) {
        allCorrect = false;
        const missingJudgments = new Array(nextWin.value.length)
          .fill(bitJudge(undefined, nextWin.value.firstBit()));

        sequenceJudgments.push(newSequenceJudgment(nextWin.value, missingJudgments));
        nextWin = winSplit.next();
        continue; // guess is done, if we were to advance it, it might even crash this thing!
      }

      const bitJudgments: BitJudgment[] = [];
      for (const winBit of nextWin.value) {
        const guessBit = nextGuess.value.getBitByGlobalIndex(winBit.index);
        const bitJudgment = bitJudge(guessBit, winBit);
        bitJudgments.push(bitJudgment);
        if (bitJudgment.isCorrect) {
          correctBits.push(guessBit);
        } else {
          allCorrect = false;
        }
      }

      sequenceJudgments.push(newSequenceJudgment(nextGuess.value, bitJudgments));
      nextGuess = guessSplit.next();
      nextWin = winSplit.next();
    }

    // Handle superfluous guesses
    while (!nextGuess.done) {
      allCorrect = false;
      const bitJudgments = [...nextGuess.value].map(bit => bitJudge(bit, undefined));
      sequenceJudgments.push(newSequenceJudgment(nextGuess.value, bitJudgments));
      nextGuess = guessSplit.next();
    }

    return new FullJudgment(allCorrect, correctBits, sequenceJudgments);
  }

  abstract judgeText(guessText: string, winText: string): FullJudgment<CharJudgment>;
}

export type { SplitterFunction, NewSequenceJudgment, BitJudge };
export { BinaryJudge, BaseBinaryJudge };
