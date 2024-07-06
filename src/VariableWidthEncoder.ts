import {BinaryEncoder} from "./BinaryEncoder.ts";

class VariableWidthEncoder implements BinaryEncoder {
  public readonly encoding: Record<string, Record<string, string>>;
  public readonly decoding: Record<string, Record<string, string>>;
  private readonly defaultEncoded: string;
  private readonly defaultDecoded: string;

  constructor(
    encoding: Record<string, Record<string, string>>,
    decoding?: Record<string, Record<string, string>>,
    defaultEncoded: string = "0",
    defaultDecoded: string = "?"
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
  }

  findForSymbol(coded: string, coding: Record<string, Record<string, string>>): string | undefined {
    for (const symbol in Object.keys(coding)) {
      if (coded in coding[symbol]) {
        return coding[symbol][coded];
      }
    }
    return undefined;
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
    const words = toEncode.split(" ");
    const encodedWords = words.map(word => {
      return [...word].map((char) => this.encodeChar(char)).join(this.encodeChar(""));
    });
    return encodedWords.join(this.encodeChar(" "));
  }

  decodeText(encoded: string): string {
    const tokens = [];
    const bitSplitter = this.splitEncodedBits(encoded);
    let nextBits = bitSplitter.next();
    while (!nextBits.done) {
      tokens.push(this.decodeChar(nextBits.value));
      nextBits = bitSplitter.next();
    }

    return tokens.join("");
  }

  *encodeAndSplit(toEncode: string): Generator<string, void, unknown> {
    for (const token of toEncode) {
      yield this.encodeChar(token);
    }
  }

  *splitEncodedBits(bits: string): Generator<string, string, unknown>{
    let tokenStart = 0;
    if (!bits) {
      return "";
    }

    while (tokenStart < bits.length) {
      const tokenSymbol = bits[tokenStart];
      const nextSymbol = Object.keys(this.encoding).filter(symbol => symbol != tokenSymbol)[0];
      let tokenEnd = bits.indexOf(nextSymbol, tokenStart);
      if (tokenEnd < 0) {
        tokenEnd = bits.length;
      }
      const nextChar = bits.slice(tokenStart, tokenEnd);
      if (nextChar != this.decodeChar("")) {
        yield nextChar;
      }
      tokenStart = tokenEnd;
    }
    return bits.slice(tokenStart);
  }
}

export {VariableWidthEncoder};
