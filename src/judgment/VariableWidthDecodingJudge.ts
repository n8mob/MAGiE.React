import { VariableWidthEncoder } from "../encoding/VariableWidthEncoder.ts";
import { CharJudgment, SequenceJudgment } from "./SequenceJudgment.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { BaseBinaryJudge, BitJudge, NewSequenceJudgment, SplitterFunction } from "./BinaryJudge.ts";
import { IndexedBit } from "../IndexedBit.ts";
import { BitSequence } from "../BitSequence.ts";
import { BitJudgment, Correctness } from "./BitJudgment.ts";

class VariableWidthDecodingJudge extends BaseBinaryJudge {
  public readonly encoder: VariableWidthEncoder;
  public readonly judgeBit = (guessBit?: IndexedBit, winBit?: IndexedBit) => {
    if (!guessBit && !winBit) {
      return new BitJudgment(new IndexedBit(undefined, 0), Correctness.hidden);
    }

    if (!guessBit) {
      return new BitJudgment(winBit!, Correctness.unguessed);
    } else if (!winBit) {
      return new BitJudgment(guessBit, Correctness.incorrect);
    }
    return new BitJudgment(guessBit, winBit.equals(guessBit) ? Correctness.correct : Correctness.incorrect);
  };
  public readonly newSequenceJudgment: NewSequenceJudgment = (
    bits: BitSequence | IndexedBit[],
    bitJudgments: string | BitJudgment[]
  ) => new SequenceJudgment(bits, bitJudgments);

  constructor(encoder: VariableWidthEncoder) {
    super();
    this.encoder = encoder;
  }

  judgeBits(
    guessBits: BitSequence,
    winBits: BitSequence,
    splitter: SplitterFunction,
    bitJudge: BitJudge = this.judgeBit,
    newSequenceJudgment = this.newSequenceJudgment
  ): FullJudgment {
    return super.judgeBits(
      guessBits,
      winBits,
      splitter,
      bitJudge,
      newSequenceJudgment
    );
  }

  judgeText(guessText: string, winText: string): FullJudgment {
    const guessBits = this.encoder.encodeText(guessText);
    const winBits = this.encoder.encodeText(winText);

    const newCharJudgment = (bits: BitSequence | IndexedBit[], judgments: string | BitJudgment[]) => new CharJudgment(bits, judgments);
    const splitter = (bits: BitSequence) => this.encoder.splitByChar(bits);
    return this.judgeBits(
      guessBits,
      winBits,
      splitter,
      this.judgeBit,
      newCharJudgment
    );
  }
}

export { VariableWidthDecodingJudge };
