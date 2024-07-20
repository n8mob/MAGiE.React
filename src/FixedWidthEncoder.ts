import BinaryEncoder, {DisplayRow} from "./BinaryEncoder.ts";
import {Bits, Chars} from "./CharJudgment.ts";
import FullJudgment from "./FullJudgment.ts";

class FixedWidthEncoder implements BinaryEncoder {
  private readonly width: number;
  public readonly encoding: Record<string, number>;
  public readonly decoding: Record<number, string>;
  private readonly defaultEncoded: number = 0;
  private readonly defaultDecoded: string = '?';

  /**
   * @param width The width of each encoded character in bits. This value is used by `splitBits`.
   * @param encoding A mapping from characters to their encoded values.
   * @param decoding Optional. A mapping from encoded values to their respective characters.
   * @param defaultEncoded Optional. The default value used when encoding an unknown character.
   * @param defaultDecoded Optional. The default character used when decoding an unknown value.
   */
  constructor(
    width: number,
    encoding: Record<string, number>,
    decoding?: Record<number, string>,
    defaultEncoded: number = 0,
    defaultDecoded: string = '?'
  ) {
    this.width = width;
    this.encoding = encoding;
    if (!decoding) {
      this.decoding = {};
      for (const key in encoding) {
        this.decoding[encoding[key]] = key;
      }
    } else {
      this.decoding = decoding;
    }
    this.defaultEncoded = defaultEncoded;
    this.defaultDecoded = defaultDecoded;
  }

  decodeChar(encodedChar: string): string {
    const encoded = parseInt(encodedChar, 2);
    return encoded in this.decoding
      ? this.decoding[encoded]
      : this.defaultDecoded;
  }

  encodeChar(charToEncode: string): string {
    return charToEncode in this.encoding
      ? this.encoding[charToEncode].toString(2).padStart(this.width, '0')
      : this.defaultEncoded.toString(2).padStart(this.width, '0');
  }

  decodeText(encodedText: string): string {
    const decoded: string[] = [];
    for (let i = 0; i < encodedText.length; i += this.width) {
      decoded.push(this.decodeChar(encodedText.slice(i, i + this.width)));
    }
    return decoded.join('');
  }

  encodeText(textToEncode: string): string {
    return [...textToEncode].map(char => this.encodeChar(char)).join('');
  }

  * encodeAndSplit(decoded: string): Generator<string, void> {
    for (const char of decoded) {
      yield this.encodeChar(char);
    }
    return;
  }

  /**
   * Yields chunked strings of bits by splitting the given string
   * into chunks of the width defined for this `FixedWidth` encoding.
   * @param bits The string of bits to be split.
   * @returns A generator yielding chunks of bits.
   * @see constructor for the `width` parameter.
   */
  * splitEncodedBits(bits: string): Generator<string, void> {
    let start = 0;
    let end = 0;

    while (start < bits.length) {
      end = start + this.width;
      yield bits.slice(start, end);
      start = end;
    }

    yield bits.slice(start);
    return;
  }

  /**
   * Yields a `DisplayRow` for each row of bits in the given string.
   * @param bits The string of bits to be split.
   * @param displayWidth The width of each row.
   * @returns A generator yielding `DisplayRow` objects.
   */
  * splitForDisplay(bits: string, displayWidth: number): Generator<DisplayRow, void> {
    let start = 0;
    let end = 0;

    if (displayWidth < this.width) {
      throw new Error(`'displayWidth' must be greater than or equal to the width of the encoding: ${this.width}`);
    }

    while (start < bits.length) {
      end = start + displayWidth;
      const bitsForRow = bits.slice(start, end);
      yield new DisplayRow(bitsForRow, this.decodeChar(bitsForRow));
      start = end;
    }

    return;
  }

  judgeBits(guessBits: string, winBits: string): FullJudgment<Bits> {
    throw new Error(`Method not implemented.\t'guessBits': ${guessBits}\t'winBits': ${winBits}`);
  }

  judgeText(guessText: string, winText: string): FullJudgment<Chars> {
    throw new Error(`Method not implemented.\t'guessText': ${guessText}\t'winText': ${winText}`);
  }

}

export {FixedWidthEncoder};
