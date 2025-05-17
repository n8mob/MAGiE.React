import { BitJudgment, Correctness } from './BitJudgment.ts';
import { IndexedBit } from "../IndexedBit.ts";
import { BitSequence } from "../BitSequence.ts";
import { DisplayRow } from "../encoding/DisplayRow.ts";

/**
 * A class representing a sequence of bits with their corresponding judgments.
 * The sequence could be an entire guess or just a part of it like a display row or a single letter.
 */
class SequenceJudgment {
  /**
   * The guess bits corresponding to the judgment bits.
   */
  guess: BitSequence;

  /**
   * The judgments corresponding to each bit in the guess.
   */
  bitJudgments: BitJudgment[];

  /**
   * Create a new SequenceJudgment for the given guess bit sequence
   * and interpret the bitJudgments string as a sequence of bits indicating the correctness of the corresponding bits.
   * @param guess
   * @param bitJudgments
   */
  constructor(guess: IndexedBit[] | BitSequence, bitJudgments: string | BitJudgment[]) {
    this.guess = guess instanceof BitSequence ? guess : new BitSequence(guess);
     if (bitJudgments instanceof Array) {
      this.bitJudgments = bitJudgments;
    } else {
      this.bitJudgments = [];
      for (let i = 0; i < bitJudgments.length; i++) {
        const correctness: Correctness = bitJudgments[i] === "1" ? Correctness.correct : Correctness.incorrect;
        this.bitJudgments.push(new BitJudgment(this.guess.getBit(i), correctness));
      }
    }
  }

  /**
   * Check if the sequence is correct.
   * @returns true if all bits are correct, false otherwise.
   */
  get isSequenceCorrect(): boolean {
    return this.bitJudgments.every(bitJudgment => bitJudgment.isCorrect);
  }

  toString(): string {
    let guessBitString = ""
    let judgmentBitString = ""

    this.bitJudgments.forEach(bitJudgment => {
      guessBitString += bitJudgment.bit;
      judgmentBitString += bitJudgment.isCorrect ? "1" : "0";
    })
    return `${guessBitString}\n${judgmentBitString} <---${this.isSequenceCorrect ? "all '1's: correct!" : "not all correct"}`;
  }

  [Symbol.iterator](): Iterator<BitJudgment> {
    let index = 0;
    const components = this.bitJudgments.slice();

    return {
      next(): IteratorResult<BitJudgment> {
        if (index < components.length) {
          return {
            done: false,
            value: components[index++],
          };
        } else {
          return {
            done: true,
            value: null,
          };
        }
      },
    };
  }

  equals(o: unknown): boolean {
    if (o instanceof SequenceJudgment) {
      return this.isSequenceCorrect === o.isSequenceCorrect &&
        this.guess.equals(o.guess) &&
        this.bitJudgments === o.bitJudgments;
    }
    return false;
  }
}

class CharJudgment extends SequenceJudgment {
  constructor(guess: BitSequence | IndexedBit[], bitJudgments: BitJudgment[] | string) {
    super(guess, bitJudgments);
  }
}

class DisplayRowJudgment extends SequenceJudgment {
  constructor(guess: DisplayRow, bitJudgments: string) {
    super(guess, bitJudgments);
  }
}

export { SequenceJudgment, CharJudgment, DisplayRowJudgment };
