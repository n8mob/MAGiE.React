export interface BinaryEncoding {
  decodeText(encoded: string): string;

  encodeText(decoded: string): string;

  decodeChar(encoded: string): string;

  encodeChar(decoded: string): string;

  encodeAndSplit(decoded: string): Generator<string, void, unknown>;

  splitBits(bits: string): Generator<string, string, unknown>;
}