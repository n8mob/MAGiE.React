import BinaryEncoder, {DisplayRow} from "./BinaryEncoder.ts";
import FullJudgment from "./FullJudgment.ts";
import {CharJudgment, SequenceJudgment} from "./SequenceJudgment.ts";

export default class FixedWidthEncoder implements BinaryEncoder {
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
  * splitByChar(bits: string): Generator<string, void> {
    let start = 0;
    let end = 0;

    while (start < bits.length) {
      end = start + this.width;
      yield bits.slice(start, end);
      start = end;
    }
    return;
  }

  /**
   * Yields a `DisplayRow` for each row of bits in the given string.
   * @param displayWidth The width of each row.
   * @param bits The string of bits to be split.
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

  judgeBits<T extends SequenceJudgment>(guessBits: string, winBits: string): FullJudgment<T> {
    const sequenceJudgments: T[] = [];
    const guessSplit = this.splitByChar(guessBits);
    const winSplit = this.splitByChar(winBits);
    let nextGuess = guessSplit.next();
    let nextWin = winSplit.next();

    let allCorrect = true;
    const correctBits: string[] = [];

    while(!nextGuess.done) {
      const sequenceGuessBits = nextGuess.value;
      if (nextWin.done) {
        allCorrect = false;
        sequenceJudgments.push(new SequenceJudgment(sequenceGuessBits, "0".repeat(sequenceGuessBits.length)) as T);
        nextGuess = guessSplit.next();
      } else {
        const sequenceWinBits = nextWin.value;
        const bitJudgments: string[] = [];
        [...sequenceWinBits].map((bit, index) => {
          const bitIsCorrect = bit === sequenceGuessBits[index];
          if (allCorrect) {
            if (bitIsCorrect) {
              correctBits.push(bit);
            } else {
              allCorrect = false;
            }
          }
          bitJudgments.push(bitIsCorrect ? "1" : "0");
        });
        sequenceJudgments.push(new SequenceJudgment(sequenceGuessBits, bitJudgments.join("")) as T);
      }

      nextGuess = guessSplit.next();
      nextWin = winSplit.next();
    }

    return new FullJudgment<T>(allCorrect, correctBits.join(''), sequenceJudgments);
  }

  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment> {
    throw new Error(`Method not implemented.\t'guessText': ${guessText}\t'winText': ${winText}`);
  }

}
