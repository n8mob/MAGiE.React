import {CharJudgment, SequenceJudgment} from "./SequenceJudgment.ts";
import FullJudgment from "./FullJudgment.ts";
import {DisplayRow} from "../encoding/BinaryEncoder.ts";

export type SplitterFunction = (bits: string) => Generator<DisplayRow | string, void>;

export default interface BinaryJudge {
  judgeBits<T extends SequenceJudgment>(guessBits: string, winBits: string, split: SplitterFunction): FullJudgment<T>;
  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment>;
}
