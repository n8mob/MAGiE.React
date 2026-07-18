import { BaseBinaryJudge, SplitterFunction } from "./BinaryJudge.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { CharJudgment } from "./SequenceJudgment.ts";
import { BitJudgment, Correctness } from "./BitJudgment.ts";
import { BinaryEncoder } from "../encoding/BinaryEncoder.ts";
import { BitSequence } from "../BitSequence.ts";
import { IndexedBit } from "../IndexedBit.ts";

/**
 * All-or-nothing judgment for Chocolate mode: a letter is correct iff every one
 * of its bits matches the win bits; otherwise the whole letter is incorrect.
 *
 * Deliberately leaks no bit-level information — every bit in a letter carries
 * the letter's correctness, never its own. There is no "unguessed" state:
 * letters start (and stay) incorrect until they are entirely right.
 */
class PerLetterJudge extends BaseBinaryJudge {
  public readonly encoder: BinaryEncoder;

  constructor(encoder: BinaryEncoder) {
    super();
    this.encoder = encoder;
  }

  judgeBits(
    guessBits: BitSequence,
    winBits: BitSequence,
    split: SplitterFunction
  ): FullJudgment {
    const guessLetters = [...split(guessBits)];
    const winLetters = [...split(winBits)];
    const sequenceJudgments: CharJudgment[] = [];
    const correctBits: IndexedBit[] = [];
    let allCorrect = true;

    winLetters.forEach((winLetter, letterIndex) => {
      const guessLetter = guessLetters[letterIndex];
      const isLetterCorrect = guessLetter !== undefined
        && guessLetter.length === winLetter.length
        && guessLetter.toPlainString() === winLetter.toPlainString();

      if (!isLetterCorrect) {
        allCorrect = false;
      }

      const letterBits = guessLetter ?? winLetter;
      const correctness = isLetterCorrect ? Correctness.correct : Correctness.incorrect;
      const bitJudgments = [...letterBits].map(bit => new BitJudgment(bit, correctness));
      if (isLetterCorrect) {
        correctBits.push(...guessLetter);
      }
      sequenceJudgments.push(new CharJudgment(letterBits, bitJudgments));
    });

    // Superfluous guess letters beyond the win text are all incorrect.
    guessLetters.slice(winLetters.length).forEach(extraLetter => {
      allCorrect = false;
      const bitJudgments = [...extraLetter].map(bit => new BitJudgment(bit, Correctness.incorrect));
      sequenceJudgments.push(new CharJudgment(extraLetter, bitJudgments));
    });

    return new FullJudgment(allCorrect, correctBits, sequenceJudgments);
  }

  judgeText(guessText: string, winText: string): FullJudgment {
    return this.judgeBits(
      this.encoder.encodeText(guessText),
      this.encoder.encodeText(winText),
      (bits) => this.encoder.splitByChar(bits)
    );
  }
}

export { PerLetterJudge };
