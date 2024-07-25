import FullJudgment from "./FullJudgment";
import {CharJudgment, SequenceJudgment} from "./SequenceJudgment.ts";

class DisplayRow {
  bits: string;
  annotation: string;

  constructor(bits: string, annotation: string = "") {
    this.bits = bits;
    this.annotation = annotation;
  }
}

interface BinaryEncoder {
  decodeText(encodedText: string): string;

  encodeText(textToEncode: string): string;

  decodeChar(encodedChar: string): string;

  encodeChar(charToEncode: string): string;

  encodeAndSplit(decoded: string): Generator<string, void, unknown>;

  splitByChar(bits: string): Generator<string, void, unknown>;

  splitForDisplay(bits: string, displayWidth: number): Generator<DisplayRow, void, unknown>;

  judgeBits<T extends SequenceJudgment>(guessBits: string, winBits: string, splitterArgument: unknown): FullJudgment<T>;

  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment>;
}

export default BinaryEncoder;
export {DisplayRow};

