import FullJudgment from "./FullJudgment";
import {Bits, Chars} from "./CharJudgment.ts";

export interface BinaryEncoder {
  decodeText(encodedText: string): string;

  encodeText(textToEncode: string): string;

  decodeChar(encodedChar: string): string;

  encodeChar(charToEncode: string): string;

  encodeAndSplit(decoded: string): Generator<string, void, unknown>;

  splitEncodedBits(bits: string): Generator<string, string, unknown>;

  judgeBits(guessBits: string, winBits: string): FullJudgment<Bits>;

  judgeText(guessText: string, winText: string): FullJudgment<Chars>;
}

