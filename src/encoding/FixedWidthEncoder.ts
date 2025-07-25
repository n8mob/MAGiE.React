import { BinaryEncoder } from "./BinaryEncoder.ts";
import { EncodingType } from "../model.ts";
import { DisplayRow } from "./DisplayRow.ts";
import { BitSequence } from "../BitSequence.ts";

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
   * @param defaultEncoded Optional. The default value that will be used when encoding an unknown character.
   * @param defaultDecoded Optional. The default character that will be used when decoding an unknown value.
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

  getType(): EncodingType {
    return "Fixed";
  }

  decodeChar(encodedChar: BitSequence): string {
    const encoded = parseInt(encodedChar.toPlainString(), 2);
    return encoded in this.decoding
           ? this.decoding[encoded]
           : this.defaultDecoded;
  }

  encodeChar(charToEncode: string, startIndex: number = 0): BitSequence {
    const s: string = charToEncode in this.encoding
                      ? this.encoding[charToEncode].toString(2).padStart(this.width, '0')
                      : this.defaultEncoded.toString(2).padStart(this.width, '0');
    return BitSequence.fromString(s, startIndex);
  }

  decodeText(encodedText: BitSequence): string {
    const decoded: string[] = [];

    for (let i = 0; i < encodedText.length; i += this.width) {
      decoded.push(this.decodeChar(encodedText.slice(i, i + this.width)));
    }
    return decoded.join('');
  }

  encodeText(textToEncode: string): BitSequence {
    let bitSequence: BitSequence = BitSequence.empty();
    for (const char of textToEncode) {
      const encodedChar = this.encodeChar(char);
      bitSequence = bitSequence.appendBitsAndReIndex(encodedChar);
    }
    return bitSequence;
  }

  /**
   * Yields DisplayRows, one row for each chunk of length `width` in the given BitString.
   * into chunks of length `width` as defined for this `FixedWidth` encoding.
   * @see FixedWidthEncoder#constructor
   * @param bits The string of bits to be split.
   * @returns A generator yielding DisplayRows, one for each `width`-length segment of bits.
   *
   */
  * splitByChar(bits: BitSequence): Generator<DisplayRow, void> {
    let start = 0;
    let end = 0;

    while (start < bits.length) {
      end = start + this.width;

      const nextCharWidth = bits.slice(start, end);
      // TODO make sure we have a test case that checks this
      const decodedChar = this.decodeChar(nextCharWidth);
      yield new DisplayRow(nextCharWidth, decodedChar);
      start = end;
    }
    return;
  }


  /**
   * Yields a `DisplayRow` for each row of bits in the given BitString.
   * @param displayWidth The width of each row.
   * @param bits The string of bits to be split.
   * @returns A generator yielding `DisplayRow` objects.
   */
  * splitForDisplay(bits: BitSequence, displayWidth: number): Generator<DisplayRow, void> {
    let start = 0;
    let end = 0;

    if (displayWidth < 1) {
      throw new Error(`Display width ${displayWidth} is too short to show characters of width ${this.width}`);
    }

    const splitWidth: number = Math.min(this.width, displayWidth);

    if (splitWidth < 1) {
      throw new Error(`Display width ${displayWidth} is too short to show characters of width ${this.width}`);
    }

    while (start < bits.length) {
      end = start + splitWidth;
      const bitsForRow = bits.slice(start, end);
      yield new DisplayRow(bitsForRow, this.decodeText(bitsForRow));
      start = end;
    }

    return;
  }
}

export { FixedWidthEncoder };
