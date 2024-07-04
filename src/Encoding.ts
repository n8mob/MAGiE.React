export interface BinaryEncoding {
  decodeText(encoded: string): string;

  encodeText(decoded: string): string;

  decodeChar(encoded: string): string;

  encodeChar(decoded: string): string;

  encodeAndSplit(decoded: string): Generator<string, void, unknown>;

  splitBits(bits: string): Generator<string, string, unknown>;
}

class FixedWidth implements BinaryEncoding {
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

  decodeChar(bits: string): string {
    const encoded = parseInt(bits, 2);
    return encoded in this.decoding
      ? this.decoding[encoded]
      : this.defaultDecoded;
  }

  encodeChar(char: string): string {
    return char in this.encoding
      ? this.encoding[char].toString(2).padStart(this.width, '0')
      : this.defaultEncoded.toString(2).padStart(this.width, '0');
  }

  decodeText(encoded: string): string {
    const decoded: string[] = [];
    for (let i = 0; i < encoded.length; i += this.width) {
      decoded.push(this.decodeChar(encoded.slice(i, i + this.width)));
    }
    return decoded.join('');
  }

  encodeText(decoded: string): string {
    return [...decoded].map(char => this.encodeChar(char)).join('');
  }

  /**
   * Yields chunked strings of bits by splitting the given string
   * into chunks of the width defined for this `FixedWidth` encoding.
   * @param bits The string of bits to be split.
   * @returns A generator yielding chunks of bits.
   * @see constructor for the `width` parameter.
   */
  * splitBits(bits: string): Generator<string, string, unknown> {
    let start = 0;
    let end = 0;

    while (start < bits.length) {
      end = start + this.width;
      yield bits.slice(start, end);
      start = end;
    }

    return bits.slice(start);
  }

  * encodeAndSplit(decoded: string): Generator<string, void, unknown> {
    for (const char of decoded) {
      yield this.encodeChar(char);
    }
  }
}

export {FixedWidth};
