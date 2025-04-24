import {CharJudgment, SequenceJudgment} from "./SequenceJudgment.ts";
import FullJudgment from "./FullJudgment.ts";
import { BitString, DisplayRow } from "../encoding/BinaryEncoder.ts";

export type SplitterFunction = (bits: BitString) => Generator<DisplayRow, void>;

export default interface BinaryJudge {
  judgeBits<T extends SequenceJudgment>(guessBits: BitString, winBits: BitString, split: SplitterFunction): FullJudgment<T>;
  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment>;
}
