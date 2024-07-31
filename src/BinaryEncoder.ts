import {EncodingType} from "./Menu.ts";

class DisplayRow {
  bits: string;
  annotation: string;

  constructor(bits: string, annotation: string = "") {
    this.bits = bits;
    this.annotation = annotation;
  }
}

interface BinaryEncoder {
  getType(): EncodingType;

  decodeText(encodedText: string): string;

  encodeText(textToEncode: string): string;

  decodeChar(encodedChar: string): string;

  encodeChar(charToEncode: string): string;

  splitByChar(bits: string): Generator<string, void>;

  splitForDisplay(bits: string, displayWidth: number): Generator<DisplayRow, void>;
}

export default BinaryEncoder;
export {DisplayRow};

