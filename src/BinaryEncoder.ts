export interface BinaryEncoder {
  decodeText(encodedText: string): string;

  encodeText(textToEncode: string): string;

  decodeChar(encodedChar: string): string;

  encodeChar(charToEncode: string): string;

  encodeAndSplit(decoded: string): Generator<string, void, unknown>;

  splitEncodedBits(bits: string): Generator<string, string, unknown>;
}

