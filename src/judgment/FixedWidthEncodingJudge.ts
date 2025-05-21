import { BaseBinaryJudge, SplitterFunction } from "./BinaryJudge.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { CharJudgment } from "./SequenceJudgment.ts";
import { FixedWidthEncoder } from "../encoding/FixedWidthEncoder.ts";
import { BitSequence } from "../BitSequence.ts";
import { BitJudgment } from "./BitJudgment.ts";

class FixedWidthEncodingJudge extends BaseBinaryJudge {
  public readonly encoder: FixedWidthEncoder;
  public readonly newCharJudgment = (bits: BitSequence, bitJudgments: BitJudgment[] | string) => new CharJudgment(
    bits,
    bitJudgments);

  constructor(encoder: FixedWidthEncoder) {
    super();
    this.encoder = encoder;
  }

  judgeBits(
    guessBits: BitSequence,
    winBits: BitSequence,
    split: SplitterFunction,
    bitJudge = this.bitJudge,
    newSequenceJudgment = this.newCharJudgment
  ): FullJudgment {
    return super.judgeBits(
      guessBits,
      winBits,
      split,
      bitJudge,
      newSequenceJudgment
    );
  }

  judgeText(guessText: string, winText: string): FullJudgment {
    const guessBits = this.encoder.encodeText(guessText);
    const winBits = this.encoder.encodeText(winText);

    return this.judgeBits(
      guessBits,
      winBits,
      (bits) => this.encoder.splitByChar(bits),
      this.bitJudge,
      this.newCharJudgment
    );
  }
}

export { FixedWidthEncodingJudge };
