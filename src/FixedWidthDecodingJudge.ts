import BinaryJudge from "./BinaryJudge.ts";
import FullJudgment from "./FullJudgment.ts";
import { SequenceJudgment, CharJudgment } from "./SequenceJudgment.ts";
import FixedWidthEncoder from "./encoding/FixedWidthEncoder.ts";

export default class FixedWidthDecodingJudge implements BinaryJudge {
  encoder: FixedWidthEncoder;
  constructor(encoder: FixedWidthEncoder) {
    this.encoder = encoder;
  }

    judgeBits<T extends SequenceJudgment>(guessBits: string, winBits: string, splitterArgument: unknown): FullJudgment<T> {
        throw new Error("Method not implemented.");
    }
    judgeText(guessText: string, winText: string): FullJudgment<CharJudgment> {
        throw new Error("Method not implemented.");
    }
}
