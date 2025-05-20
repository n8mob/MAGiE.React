import { BaseBinaryJudge, BitJudge, SplitterFunction } from "./BinaryJudge.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { CharJudgment, SequenceJudgment } from "./SequenceJudgment.ts";
import { FixedWidthEncoder } from "../encoding/FixedWidthEncoder.ts";
import { BitSequence } from "../BitSequence.ts";
import { IndexedBit } from "../IndexedBit.ts";
import { BitJudgment, Correctness } from "./BitJudgment.ts";

class FixedWidthDecodingJudge extends BaseBinaryJudge {
  public readonly encoder: FixedWidthEncoder;
  public readonly bitJudge: BitJudge = (guessBit: IndexedBit, winBit: IndexedBit) => {
    if (!guessBit) {
      return new BitJudgment(winBit, Correctness.unguessed);
    }
    return new BitJudgment(guessBit, winBit.equals(guessBit) ? Correctness.correct : Correctness.incorrect);
  };
  public readonly newSequenceJudgment = (
    bits: BitSequence,
    bitJudgments: string | BitJudgment[]
  ) => new SequenceJudgment(bits, bitJudgments);

  constructor(encoder: FixedWidthEncoder) {
    super();
    this.encoder = encoder;
  }

  judgeBits<T extends SequenceJudgment>(
    guessBits: BitSequence,
    winBits: BitSequence,
    splitter: SplitterFunction,
    bitJudge: BitJudge = this.bitJudge,
    newSequenceJudgment: (bits: BitSequence, judgments: string) => T = this.newSequenceJudgment
  ): FullJudgment<T> {
    return super.judgeBits(
      guessBits,
      winBits,
      splitter,
      bitJudge,
      newSequenceJudgment
    );
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
