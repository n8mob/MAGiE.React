import { BinaryEncoder } from "./BinaryEncoder.ts";
import { EncodingType } from "../Menu.ts";
import { DisplayRow } from "./DisplayRow.ts";
import { BitSequence } from "../BitSequence.ts";


class VariableWidthEncoder implements BinaryEncoder {
  public readonly encoding: Record<string, Record<string, string>>;
  public readonly decoding: Record<string, Record<string, string>>;
  readonly defaultEncoded: string;
  readonly defaultDecoded: string;
  readonly characterSeparator: string;

  /**
   * I only know my own "alpha-length" encoding, which this will work for.
   *
   * The JSON format that this expects is:
   * @example simple alpha-length encoding
   * ```JSON
   * {
   *   "1": {
   *     "A": "1",
   *     "B": "11",
   *     "C": "111"
   *     },
   *   "0": {
   *     "": "0",
   *     " ": "00",
   *     ".": "000",
   *     ". ": "00000"
   *   }
   * }
   * ```
   *
   * Note that all the "1" symbols are in the first object, and all the "0" symbols are in the second object.
   * To encode a given symbol:
   *
   * 1. loop over the 2 top-level objects.
   * 2. check to see if that object has the symbol we want to encode as one of its keys.
   * 3. If it does, we return the value of that key, which is the encoding.
   * 4. If not, check the list of 0-encoded symbols, and if it is in there, return that encoding.
   * 5. If it's not in either of those dictionaries, we return the default encoding (defaults to "0").
   *
   *
   * @example simple alpha-length decoding

   * ```JSON
   * {
   *   "1": {
   *     "1": "A",
   *     "11": "B",
   *     "111": "C"
   *   },
   *   "0": {
   *     "0": "",
   *     "00": " ",
   *     "000": ".",
   *     "00000": ". ",
   *   }
   * }
   * ```
   * The process is basically the same as encoding, but the symbols are simply reversed.
   * 1. Look to see if the encoded string is in the set of keys for the first object, or the second object.
   * 2. Return the appropriate value
   * 3. or the default decoding (defaults to "?").
   *
   * @param encoding A map of symbols to their encodings.
   * @param decoding A map of encodings to their symbols.
   * @param defaultEncoded The default encoding for unknown symbols.
   * The default value for default encoding is "0".
   * @param defaultDecoded The default decoding for unknown symbols.
   * The default value for default decoding is "?".
   * @param characterSeparator The separator between characters in the encoded string.
   * The default character separator is "0".
   */
  constructor(
    encoding: Record<string, Record<string, string>>,
    decoding?: Record<string, Record<string, string>>,
    defaultEncoded = "0",
    defaultDecoded = "?",
    characterSeparator = "0"
  ) {
    this.encoding = {} as Record<string, Record<string, string>>;
    this.parseEncoding(encoding);

    this.decoding = {} as Record<string, Record<string, string>>;
    if (!decoding) {
      this.reverseEncoding(encoding);
    } else {
      this.parseDecoding(decoding);
    }

    this.defaultEncoded = defaultEncoded;
    this.defaultDecoded = defaultDecoded;
    this.characterSeparator = characterSeparator;
  }

  private parseEncoding(encoding: Record<string, Record<string, string>>) {
    for (const symbol in encoding) {
      this.encoding[symbol] = {};
      for (const coded in encoding[symbol]) {
        this.encoding[symbol][coded] = BitSequence.stripNonBits(encoding[symbol][coded]);
      }
    }
  }

  private parseDecoding(decoding: Record<string, Record<string, string>>) {
    for (const symbol in decoding) {
      this.decoding[symbol] = {} as Record<string, string>;
      for (const coded in decoding[symbol]) {
        const stripped = BitSequence.stripNonBits(coded) as string;
        this.decoding[symbol][stripped] = decoding[symbol][coded];
      }
    }
  }

  private reverseEncoding(encoding: Record<string, Record<string, string>>) {
    for (const symbol in encoding) {
      this.decoding[symbol] = {} as Record<string, string>;
      for (const coded in encoding[symbol]) {
        this.decoding[symbol][encoding[symbol][coded]] = coded;
      }
    }
  }

  getType(): EncodingType {
    return "Variable";
  }

  /**
   * Encodes a character into a sequence of bits.
   * @param toEncode A string containing the single character to encode.
   */
  encodeChar(toEncode: string): BitSequence {
    for (const symbol in this.encoding) {
      if (toEncode in this.encoding[symbol]) {
        return BitSequence.fromString(this.encoding[symbol][toEncode]);
      }
    }
    return BitSequence.fromString(this.defaultEncoded);
  }

  decodeChar(encodedBits: BitSequence): string {
    const encoded = encodedBits.toPlainString();
    for (const symbol in this.decoding) {
      if (encoded in this.decoding[symbol]) {
        return this.decoding[symbol][encoded];
      }
    }
    return this.defaultDecoded;
  }

  encodeText(toEncode: string): BitSequence {
    if (!toEncode) {
      return BitSequence.empty();
    }

    // now the string is at least 1 character long
    const encodedSplit = this.encodeAndSplit(toEncode);
    let encodedText: BitSequence = BitSequence.empty();
    let nextResult = encodedSplit.next();

    while (!nextResult.done) {
      const nextChar = nextResult.value;
      if (encodedText.endsWith(nextChar.firstBit().toString()) && !nextChar.startsWith(this.characterSeparator)) {
        encodedText = encodedText.appendBits(this.characterSeparator);
      }
      encodedText = encodedText.appendBits(nextChar);
      nextResult = encodedSplit.next();
    }

    return encodedText;
  }

  decodeText(encoded: BitSequence): string {
    const tokens: string[] = [];
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
  * encodeAndSplit(toEncode: string): Generator<BitSequence, void> {
    for (const token of toEncode) {
      yield this.encodeChar(token);
    }
  }

  /**
   * Splits a string of bits into individual characters.
   * @implNote omits the character separator
   * @param bits
   */
  * splitByChar(bits: BitSequence): Generator<BitSequence, void> {
    let tokenStart = 0;
    if (!bits) {
      return;
    }

    while (tokenStart < bits.length) {
      const tokenSymbol = bits.getBit(tokenStart);
      const oppositeEncodingSymbol = BitSequence.stripNonBits(
        Object.keys(this.encoding).filter(symbol => !tokenSymbol.equals(symbol))[0]
      );

      if (!oppositeEncodingSymbol) {
        console.warn("No opposite encoding symbol found for token symbol", tokenSymbol);
        break;
      }

      const nextSymbol = oppositeEncodingSymbol[0] as '0' | '1';
      let tokenEnd = bits.indexOf(nextSymbol, tokenStart);
      if (tokenEnd < 0) {
        tokenEnd = bits.length;
      }
      if (tokenEnd === tokenStart) {
        // Prevent infinite loop
        tokenStart++;
        continue;
      }
      const nextChar = bits.slice(tokenStart, tokenEnd);
      if (!nextChar.equals(this.characterSeparator)) {
        yield nextChar;
      }
      tokenStart = tokenEnd;
    }
    return;
  }

  * splitForDisplay(bits: BitSequence, displayWidth: number): Generator<DisplayRow, void> {
    if (displayWidth < 1) {
      throw new Error(`Display width ${displayWidth} is too short`);
    }

    let remaining: BitSequence = bits;
    while (remaining.length >= displayWidth) {
      const nextSlice = remaining.slice(0, displayWidth);
      remaining = remaining.slice(displayWidth);
      yield new DisplayRow(nextSlice);
    }
    if (!remaining.isEmpty) {
      yield new DisplayRow(remaining);
    }
    return;
  }
}

export { VariableWidthEncoder };
