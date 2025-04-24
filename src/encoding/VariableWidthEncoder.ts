import BinaryEncoder, { BitString, DisplayBit, DisplayRow } from "./BinaryEncoder.ts";
import { EncodingType } from "../Menu.ts";

export default class VariableWidthEncoder implements BinaryEncoder {
  public readonly encoding: Record<string, Record<string, BitString>>;
  public readonly decoding: Record<string, Record<BitString, string>>;
  readonly defaultEncoded: BitString = ["0"];
  readonly defaultDecoded: string;
  readonly characterSeparator: BitString;

  constructor(
    encoding: Record<string, Record<string, BitString>>,
    decoding?: Record<string, Record<BitString, string>>,
    defaultEncoded: BitString = ["0"],
    defaultDecoded: string = "?",
    characterSeparator: BitString = ["0"]
  ) {
    //this.encoding = encoding;
    // need to translate all the 'strings' in the given encoding to bitstrings
    this.encoding = {};
    for (const symbol in encoding) {
      this.encoding[symbol] = {};
      for (const coded in encoding[symbol]) {
        this.encoding[symbol][coded] = encoding[symbol][coded].split("")
          .map((bit) => parseInt(bit));
      }
    }
    this.defaultEncoded = defaultEncoded;
    this.defaultDecoded = defaultDecoded;
    if (!decoding) {
      this.decoding = {};
      for (const symbol in encoding) {
        this.decoding[symbol] = {};
        for (const coded in encoding[symbol]) {
          this.decoding[symbol][encoding[symbol][coded]] = coded;
        }
      }
    } else {
      this.decoding = decoding;
    }
    this.characterSeparator = characterSeparator;
  }

  getType(): EncodingType {
    return "Variable";
  }

  /**
   * Encodes a character into a string of bits.
   * @param toEncode A string containing the single character to encode.
   */
  encodeChar(toEncode: string): BitString {
    for (const symbol in this.encoding) {
      if (toEncode in this.encoding[symbol]) {
        return this.encoding[symbol][toEncode];
      }
      return this.defaultEncoded;
    }
  }

  decodeChar(encoded: BitString): string {
    for (const symbol in this.decoding) {
      if (encoded in this.decoding[symbol]) {
        return this.decoding[symbol][encoded];
      }
    }
    return this.defaultDecoded;
  }

  encodeText(toEncode: string): BitString {
    const encodedSplit = this.encodeAndSplit(toEncode);
    let encodedText: DisplayBit[] = [];
    let prev = "";
    let nextSplit = encodedSplit.next();

    while (!nextSplit.done) {
      const next = nextSplit.value;
      if (prev && prev[prev.length - 1] === next[0] && next[0] !== this.characterSeparator) {
        encodedText += this.characterSeparator;
      }
      encodedText += next;
      prev = next;
      nextSplit = encodedSplit.next();
    }

    return encodedText;
  }

  decodeText(encoded: string): string {
    const tokens = [];
    const charBits = this.splitByChar(encoded);
    let nextBits = charBits.next();
    while (!nextBits.done) {
      tokens.push(this.decodeChar(nextBits.value));
      nextBits = charBits.next();
    }

    return tokens.join("");
  }

  /**
   * Encodes a string of characters, yielding a BitString for each character in the given string
   * @see splitByChar
   * @param toEncode
   */
  * encodeAndSplit(toEncode: string): Generator<BitString, void> {
    for (const token of toEncode) {
      yield this.encodeChar(token);
    }
  }

  /**
   * Splits a string of bits into individual characters.
   * @implNote omits the character separator
   * @param bits
   */
  * splitByChar(bits: BitString): Generator<string, void> {
    let tokenStart = 0;
    if (!bits) {
      return;
    }

    while (tokenStart < bits.length) {
      const tokenSymbol = bits[tokenStart];
      const nextSymbol = Object.keys(this.encoding).filter(symbol => symbol != tokenSymbol)[0];
      let tokenEnd = bits.indexOf(nextSymbol, tokenStart);
      if (tokenEnd < 0) {
        tokenEnd = bits.length;
      }
      const nextChar = bits.slice(tokenStart, tokenEnd);
      if (nextChar != this.characterSeparator) {
        yield nextChar;
      }
      tokenStart = tokenEnd;
    }
    return;
  }

  * splitForDisplay(bits: BitString, displayWidth: number): Generator<DisplayRow, void> {
    let displayBits: DisplayBit[] = [];
    let remaining: BitString = bits;
    let index = 0;
    while (remaining.length >= displayWidth) {
      displayBits = remaining.slice(0, displayWidth).map((bit) => new DisplayBit(bit, index++));
      remaining = remaining.slice(displayWidth);
      yield new DisplayRow(displayBits, "");
    }
    yield new DisplayRow(remaining.map((bit) => new DisplayBit(bit, index++)), "");
    return;
  }
}
