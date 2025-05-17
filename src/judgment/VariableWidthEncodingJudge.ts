import { BaseBinaryJudge, SplitterFunction } from "./BinaryJudge.ts";
import { CharJudgment, SequenceJudgment } from "./SequenceJudgment.ts";
import { VariableWidthEncoder } from "../encoding/VariableWidthEncoder.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { BitSequence } from "../BitSequence.ts";
import { IndexedBit } from "../IndexedBit.ts";
import { BitJudgment, Correctness } from "./BitJudgment.ts";

class VariableWidthEncodingJudge extends BaseBinaryJudge {
  public readonly encoder: VariableWidthEncoder;
  public readonly bitJudge = (guessBit: IndexedBit, winBit: IndexedBit) => {
    if (!guessBit) {
      return new BitJudgment(winBit, Correctness.hidden);
    } else if (!winBit) {
      return new BitJudgment(guessBit, Correctness.incorrect);
    }
    return new BitJudgment(guessBit, winBit.equals(guessBit) ? Correctness.correct : Correctness.incorrect);
  };
  public readonly newCharJudgment = (bits: BitSequence, bitJudgments: BitJudgment[] | string) => new CharJudgment(
    bits,
    bitJudgments);

  constructor(encoder: VariableWidthEncoder) {
    super();
    this.encoder = encoder;
  }

  judgeBits<T extends SequenceJudgment>(
    guessBits: BitSequence,
    winBits: BitSequence,
    split: SplitterFunction,
    bitJudge = this.bitJudge,
    newSequenceJudgment: (bits: BitSequence, judgments: string) => T = this.newCharJudgment
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

    const splitter = (bits: BitSequence) => this.encoder.splitByChar(bits);
    return this.judgeBits(
      guessBits,
      winBits,
      splitter
    );
  }
}

export { VariableWidthEncodingJudge };
