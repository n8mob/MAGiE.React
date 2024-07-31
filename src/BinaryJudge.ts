import {CharJudgment, SequenceJudgment} from "./SequenceJudgment.ts";
import FullJudgment from "./FullJudgment.ts";

export default interface BinaryJudge {
  judgeBits<T extends SequenceJudgment>(guessBits: string, winBits: string, splitterArgument: unknown): FullJudgment<T>;
  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment>;
}
