import { BaseBinaryJudge, BitJudge, NewSequenceJudgment, SplitterFunction } from "./BinaryJudge.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { SequenceJudgment } from "./SequenceJudgment.ts";
import { FixedWidthEncoder } from "../encoding/FixedWidthEncoder.ts";
import { BitSequence } from "../BitSequence.ts";
import { IndexedBit } from "../IndexedBit.ts";
import { BitJudgment, Correctness } from "./BitJudgment.ts";

class FixedWidthDecodingJudge extends BaseBinaryJudge {
  public readonly encoder: FixedWidthEncoder;
  public readonly bitJudge: BitJudge = (guessBit?: IndexedBit, winBit?: IndexedBit) => {
    if (!guessBit && !winBit) {
      return new BitJudgment(new IndexedBit(undefined, 0), Correctness.hidden);
    }

    if (!guessBit) {
      return new BitJudgment(winBit!, Correctness.unguessed);
    }

    if (!winBit) {
      return new BitJudgment(guessBit, Correctness.incorrect);
    }

    return new BitJudgment(guessBit, winBit.equals(guessBit) ? Correctness.correct : Correctness.incorrect);
  };
  public readonly newSequenceJudgment: NewSequenceJudgment = (
    bits: BitSequence,
    bitJudgments: string | BitJudgment[]
  ) => new SequenceJudgment(bits, bitJudgments);

  constructor(encoder: FixedWidthEncoder) {
    super();
    this.encoder = encoder;
  }

  judgeBits(
    guessBits: BitSequence,
    winBits: BitSequence,
    splitter: SplitterFunction,
    bitJudge: BitJudge = this.bitJudge,
    newSequenceJudgment?: NewSequenceJudgment
  ): FullJudgment {
    return super.judgeBits(
      guessBits,
      winBits,
      splitter,
      bitJudge,
      newSequenceJudgment ?? this.newSequenceJudgment
    );
  }

  judgeText(guessText: string, winText: string): FullJudgment {
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
