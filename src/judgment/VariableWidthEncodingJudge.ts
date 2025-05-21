import { BaseBinaryJudge, SplitterFunction } from "./BinaryJudge.ts";
import { CharJudgment } from "./SequenceJudgment.ts";
import { VariableWidthEncoder } from "../encoding/VariableWidthEncoder.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { BitSequence } from "../BitSequence.ts";
import { BitJudgment } from "./BitJudgment.ts";

class VariableWidthEncodingJudge extends BaseBinaryJudge {
  public readonly encoder: VariableWidthEncoder;
  public readonly newCharJudgment = (bits: BitSequence, bitJudgments: BitJudgment[] | string) => new CharJudgment(
    bits,
    bitJudgments);

  constructor(encoder: VariableWidthEncoder) {
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

    const splitter = (bits: BitSequence) => this.encoder.splitByChar(bits);
    return this.judgeBits(
      guessBits,
      winBits,
      splitter
    );
  }
}

export { VariableWidthEncodingJudge };
