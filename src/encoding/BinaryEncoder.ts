import { EncodingType } from "../Menu.ts";
import { DisplayRow } from "./DisplayRow.ts";
import { BitSequence } from "../BitSequence.ts";

interface BinaryEncoder {
  getType(): EncodingType;

  decodeText(encodedText: BitSequence): string;

  encodeText(textToEncode: string): BitSequence;

  decodeChar(encodedChar: BitSequence): string;

  encodeChar(charToEncode: string, startIndex?: number): BitSequence;

  splitByChar(bits: BitSequence): Generator<BitSequence, void>;

  splitForDisplay(bits: BitSequence, displayWidth: number): Generator<DisplayRow, void>;
}

export default BinaryEncoder;

