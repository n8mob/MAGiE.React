import { BaseBinaryJudge, SplitterFunction } from "./BinaryJudge.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { CharJudgment, SequenceJudgment } from "./SequenceJudgment.ts";
import { FixedWidthEncoder } from "../encoding/FixedWidthEncoder.ts";
import { BitSequence } from "../BitSequence.ts";
import { BitJudgment, Correctness } from "./BitJudgment.ts";
import { IndexedBit } from "../IndexedBit.ts";

class FixedWidthEncodingJudge extends BaseBinaryJudge {
  public readonly encoder: FixedWidthEncoder;
  public readonly bitJudge = (guessBit: IndexedBit, winBit: IndexedBit) => {
    if (!guessBit) {
      return new BitJudgment(winBit, Correctness.hidden)
    } else if (!winBit) {
      return new BitJudgment(guessBit, Correctness.incorrect);
    }

    return new BitJudgment(guessBit, winBit.equals(guessBit) ? Correctness.correct : Correctness.incorrect);
  };
  public readonly newCharJudgment = (bits: BitSequence, bitJudgments: BitJudgment[] | string) => new CharJudgment(
    bits,
    bitJudgments);

  constructor(encoder: FixedWidthEncoder) {
    super();
    this.encoder = encoder;
  }

  judgeBits<T extends SequenceJudgment>(
    guessBits: BitSequence,
    winBits: BitSequence,
    split: SplitterFunction,
    bitJudge = this.bitJudge,
    newSequenceJudgment: (bits: BitSequence, judgments: BitJudgment[] | string) => T = this.newCharJudgment
  ): FullJudgment<T> {
    return super.judgeBits(
      guessBits,
      winBits,
      split,
      bitJudge,
      newSequenceJudgment
    );
  }

  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment> {
    const guessBits = this.encoder.encodeText(guessText);
    const winBits = this.encoder.encodeText(winText);

    return this.judgeBits<CharJudgment>(
      guessBits,
      winBits,
      (bits) => this.encoder.splitByChar(bits),
      this.bitJudge,
      this.newCharJudgment
    );
  }
}

export { FixedWidthEncodingJudge };
