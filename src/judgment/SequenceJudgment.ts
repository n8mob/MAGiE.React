import { BitJudgment } from './BitJudgment.ts';
import { IndexedBit } from "../IndexedBit.ts";
import { BitSequence } from "../BitSequence.ts";
import { DisplayRow } from "../encoding/DisplayRow.ts";

/**
 * A class representing a sequence of bits with their corresponding judgments.
 * The sequence could be an entire guess or just a part of it like a display row or a single letter.
 */
export class SequenceJudgment {
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
  constructor(guess: IndexedBit[] | BitSequence, bitJudgments: string) {
    this.guess = guess instanceof BitSequence ? guess : new BitSequence(guess);
    this.bitJudgments = [];

    for (let i = 0; i < this.guess.length; i++) {
      const judgment = new BitJudgment(this.guess.getBit(i), bitJudgments[i] == "1");
      this.bitJudgments.push(judgment);
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
    let pointer = 0;
    const components = this.bitJudgments;

    return {
      next(): IteratorResult<BitJudgment> {
        if (pointer < components.length) {
          return {
            done: false,
            value: components[pointer++],
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

export class CharJudgment extends SequenceJudgment {
  constructor(guess: BitSequence, bitJudgments: string) {
    super(guess, bitJudgments);
  }
}

export class DisplayRowJudgment extends SequenceJudgment {
  constructor(guess: DisplayRow, bitJudgments: string) {
    super(guess, bitJudgments);
  }
}

