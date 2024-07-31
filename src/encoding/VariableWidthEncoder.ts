import BinaryEncoder, {DisplayRow} from "./BinaryEncoder.ts";
import {EncodingType} from "../Menu.ts";

export type SplitterFunction = (bits: string) => Generator<string | DisplayRow, void>;

export default class VariableWidthEncoder implements BinaryEncoder {
  public readonly encoding: Record<string, Record<string, string>>;
  public readonly decoding: Record<string, Record<string, string>>;
  readonly defaultEncoded: string;
  readonly defaultDecoded: string;
  readonly characterSeparator: string;

  constructor(
    encoding: Record<string, Record<string, string>>,
    decoding?: Record<string, Record<string, string>>,
    defaultEncoded: string = "0",
    defaultDecoded: string = "?",
    characterSeparator: string = "0"
  ) {
    this.encoding = encoding;
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

  findForSymbol(coded: string, coding: Record<string, Record<string, string>>): string | undefined {
    for (const symbol in Object.keys(coding)) {
      if (coded in coding[symbol]) {
        return coding[symbol][coded];
      }
    }
    return undefined;
  }

  _encodeChar(toEncode: string | DisplayRow): string {
    if (typeof toEncode === "string") {
      return this.encodeChar(toEncode);
    } else {
      return this.encodeChar(toEncode.bits);
    }
  }

  encodeChar(toEncode: string): string {
    const encoded = this.findForSymbol(toEncode, this.encoding);
    return encoded ? encoded : this.defaultEncoded;
  }

  decodeChar(encoded: string): string {
    const decoded = this.findForSymbol(encoded, this.decoding);
    if (decoded === undefined) {
      return this.defaultDecoded;
    } else {
      return decoded;
    }
  }

  encodeText(toEncode: string): string {
    const encodedSplit = this.encodeAndSplit(toEncode);
    let encodedText = "";
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
   * Encodes a string of characters into a string of bits and then splits the bits into sequences for each character.
   * @see splitByChar
   * @param toEncode
   */
  * encodeAndSplit(toEncode: string): Generator<string, void> {
    for (const token of toEncode) {
      yield this.encodeChar(token);
    }
  }

  /**
   * Splits a string of bits into individual characters.
   * @implNote omits the character separator
   * @param bits
   */
  * splitByChar(bits: string): Generator<string, void> {
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

  * splitForDisplay(bits: string, displayWidth: number): Generator<DisplayRow, void> {
    let displayBits = "";
    let remaining = bits;
    while (remaining.length >= displayWidth) {
      displayBits = remaining.slice(0, displayWidth);
      remaining = remaining.slice(displayWidth);
      yield new DisplayRow(displayBits, "");
    }
    yield new DisplayRow(remaining, "");
    return;
  }
}
