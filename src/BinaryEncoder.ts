import FullJudgment from "./FullJudgment";
import {Bits, Chars} from "./CharJudgment.ts";

class DisplayRow {
  display: string;
  annotation: string;

  constructor(bits: string, annotation: string = "") {
    this.display = bits;
    this.annotation = annotation;
  }
}

interface BinaryEncoder {
  decodeText(encodedText: string): string;

  encodeText(textToEncode: string): string;

  decodeChar(encodedChar: string): string;

  encodeChar(charToEncode: string): string;

  encodeAndSplit(decoded: string): Generator<string, void, unknown>;

  splitEncodedBits(bits: string): Generator<string, string, unknown>;

  splitForDisplay(bits: string, displayWidth: number): Generator<DisplayRow, void>;

  judgeBits(guessBits: string, winBits: string): FullJudgment<Bits>;

  judgeText(guessText: string, winText: string): FullJudgment<Chars>;
}

export default BinaryEncoder;
export {DisplayRow};

