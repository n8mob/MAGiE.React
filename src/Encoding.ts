export interface BinaryEncoding {
  decodeText(encoded: string): string;

  encodeText(decoded: string): string;

  decodeChar(encoded: string): string;

  encodeChar(decoded: string): string;
}

class FixedWidth implements BinaryEncoding {
  private readonly width: number;
  public readonly encoding: Record<string, number>;
  public readonly decoding: Record<number, string>;
  private readonly defaultEncoded: number = 0;
  private readonly defaultDecoded: string = '?';

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
}

export {FixedWidth};
