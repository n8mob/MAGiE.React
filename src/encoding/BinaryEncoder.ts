import { EncodingType } from "../Menu.ts";

type BitString = Array<"0" | "1">;

function stripNonBits(s: string): BitString {
  return s.replace(/[^01]/g, "").split("") as BitString;
}

class DisplayBit {
  bit: "0" | "1" | undefined;
  globalIndex: number;

  constructor(bit: "0" | "1" | undefined, globalIndex: number) {
    this.bit = bit;
    this.globalIndex = globalIndex;
  }
}

class DisplayRow {
  bits: DisplayBit[];
  annotation: string;

  constructor(bits: DisplayBit[], annotation: string = "") {
    this.bits = bits;
    this.annotation = annotation;
  }

  toString(): string {
    const bitString = this.bits.map(bit => bit.bit).join("");
    return `${bitString} ${this.annotation}`.trim();
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
export { DisplayBit, DisplayRow, stripNonBits };
export type { BitString };

