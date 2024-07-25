import BinaryEncoder, {DisplayRow} from "./BinaryEncoder.ts";
import FullJudgment from "./FullJudgment.ts";
import {CharJudgment, DisplayRowJudgment, SequenceJudgment} from "./SequenceJudgment.ts";

export type SplitterFunction = (bits: string) => Generator<string | DisplayRow, void>;

export default class VariableWidthEncoder implements BinaryEncoder {
  public readonly encoding: Record<string, Record<string, string>>;
  public readonly decoding: Record<string, Record<string, string>>;
  private readonly defaultEncoded: string;
  private readonly defaultDecoded: string;
  private readonly characterSeparator: string;

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

  _judgeBits<T extends SequenceJudgment>(
    guessBits: string,
    winBits: string,
    splitter: SplitterFunction,
    newSequenceJudgment: (bits: string, judgments: string) => T = (bits, judgments) => new SequenceJudgment(bits, judgments) as T
  ): FullJudgment<T> {
    const sequenceJudgments: T[] = [];
    const guessSplit = splitter(guessBits);
    const winSplit = splitter(winBits);
    let nextGuess = guessSplit.next();
    let nextWin = winSplit.next();

    let allCorrect = true;
    let correctBits = "";
    let lastCorrectBit = "";

    while (!nextGuess.done) {
      let sequenceGuessBits: string;
      if (nextGuess.value instanceof DisplayRow) {
        sequenceGuessBits = nextGuess.value.bits;
      } else {
        sequenceGuessBits = nextGuess.value;
      }

      if (nextWin.done) {
        allCorrect = false;
        sequenceJudgments.push(newSequenceJudgment(sequenceGuessBits, "0".repeat(sequenceGuessBits.length)));
        nextGuess = guessSplit.next();
      } else {
        console.log(`nextGuess: ${sequenceGuessBits}\tnextWin: ${nextWin.value}`);
        let sequenceWinBits: string;
        if (nextWin.value instanceof DisplayRow) {
          sequenceWinBits = nextWin.value.bits;
        } else {
          sequenceWinBits = nextWin.value;
        }

        let bitJudgments: string;
        if (sequenceWinBits === sequenceGuessBits) {
          bitJudgments = "1".repeat(sequenceGuessBits.length);
          if (lastCorrectBit !== "") {
            if (lastCorrectBit === sequenceGuessBits[sequenceGuessBits.length - 1] && sequenceGuessBits !== this.characterSeparator) {
              correctBits += this.characterSeparator;
            }
          }
          correctBits += sequenceGuessBits;
          lastCorrectBit = sequenceGuessBits[sequenceGuessBits.length - 1];
        } else {
          bitJudgments = [...sequenceWinBits].map((winBit, index) => winBit === sequenceGuessBits[index] ? "1" : "0").join("");
          allCorrect = false;
        }
        sequenceJudgments.push(newSequenceJudgment(sequenceGuessBits, bitJudgments));
        nextGuess = guessSplit.next();
        nextWin = winSplit.next();
      }
    }

    return new FullJudgment<T>(allCorrect, correctBits, sequenceJudgments);
  }

  judgeBits<T extends DisplayRowJudgment>(guessBits: string, winBits: string, displayRowWidth: number): FullJudgment<T> {
    const splitter: SplitterFunction = (bits: string) => this.splitForDisplay(bits, displayRowWidth);
    return this._judgeBits(
      guessBits,
      winBits,
      splitter,
      (bits, judgments) => new DisplayRowJudgment(bits, judgments) as T
    );
  }

  judgeText(guessText: string, winText: string): FullJudgment<CharJudgment> {
    const guessBits = this.encodeText(guessText);
    const winBits = this.encodeText(winText);

    const newCharJudgment = (bits: string, judgments: string) => new CharJudgment(bits, judgments);
    const splitter = (bits: string) => this.splitByChar(bits);
    return this._judgeBits(
      guessBits,
      winBits,
      splitter,
      newCharJudgment
    );
  }
}
