import { CharJudgment, SequenceJudgment } from "./SequenceJudgment.ts";
import { FullJudgment } from "./FullJudgment.ts";
import { BitSequence } from "../BitSequence.ts";

type SplitterFunction = (bits: BitSequence) => Generator<BitSequence, void>;

interface BinaryJudge {
  judgeBits<T extends SequenceJudgment>(
    guessBits: BitSequence,
    winBits: BitSequence,
    split: SplitterFunction
  ): FullJudgment<T>;

  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment>;
}

class BaseBinaryJudge implements BinaryJudge {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  judgeBits<T extends SequenceJudgment>(_guessBits: BitSequence, _winBits: BitSequence, _split: SplitterFunction): FullJudgment<T> {
    return new FullJudgment(false, BitSequence.empty(), []);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  judgeText(_guessText: string, _winText: string): FullJudgment<CharJudgment> {
    return new FullJudgment(false, BitSequence.empty(), []);
  }
}

export type { BinaryJudge, SplitterFunction };
export { BaseBinaryJudge };
