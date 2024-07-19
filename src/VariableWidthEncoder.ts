import BinaryEncoder, {DisplayRow} from "./BinaryEncoder.ts";
import FullJudgment from "./FullJudgment.ts";
import CharJudgment, {Bits, Chars} from "./CharJudgment.ts";

class VariableWidthEncoder implements BinaryEncoder {
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
    const bitSplitter = this.splitEncodedBits(encoded);
    let nextBits = bitSplitter.next();
    while (!nextBits.done) {
      tokens.push(this.decodeChar(nextBits.value));
      nextBits = bitSplitter.next();
    }

    return tokens.join("");
  }

  /**
   * Encodes a string of characters into a string of bits and then splits the bits into sequences for each character.
   * @see splitEncodedBits
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
  * splitEncodedBits(bits: string): Generator<string, string> {
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
      if (nextChar != this.characterSeparator) {
        yield nextChar;
      }
      tokenStart = tokenEnd;
    }
    return bits.slice(tokenStart);
  }

  * splitForDisplay(bits: string, displayWidth: number): Generator<DisplayRow, void> {
    let display = "";
    let remaining = bits;
    while (remaining.length > displayWidth) {
      display = remaining.slice(0, displayWidth);
      remaining = remaining.slice(displayWidth);
      yield new DisplayRow(display, "");
    }
    yield new DisplayRow(remaining, "");
    return;
  }

  judgeBits(guessBits: string, winBits: string): FullJudgment<Bits> {
    const charJudgments: CharJudgment<Bits>[] = [];
    const splitGuess = this.splitEncodedBits(guessBits);
    const splitWin = this.splitEncodedBits(winBits);

    let nextGuess = splitGuess.next();
    let nextWin = splitWin.next();

    let allCorrect = true;
    const correctBits: Bits[] = [];
    let lastCorrectBit: string = "";

    while (!nextGuess.done) {
      if (nextWin.done) {
        allCorrect = false;
        charJudgments.push(new CharJudgment(false, nextGuess.value, this.decodeChar("")));
        nextGuess = splitGuess.next();
      } else {
        const guess = nextGuess.value;
        const win = nextWin.value;
        const bitJudgments = [...guess].map(
          (bit, index) => bit == win[index] ? "1" : "0"
        ).join("");

        const charCorrect = [...bitJudgments].every(bit => bit == "1");
        allCorrect = allCorrect && charCorrect;
        if (allCorrect) {
          const firstGuessBit = guess[0];
          if (lastCorrectBit !== "") {
            if (lastCorrectBit === firstGuessBit && firstGuessBit !== this.characterSeparator) {
              // 1's must be separated
              correctBits.push(this.characterSeparator);
            }
          }
          correctBits.push(guess);
          lastCorrectBit = guess[guess.length - 1];
        }

        charJudgments.push(new CharJudgment(charCorrect, guess, bitJudgments));
        nextGuess = splitGuess.next();
        nextWin = splitWin.next();
      }
    }

    if (allCorrect) {
      if (!nextWin.done || !nextGuess.done) {
        allCorrect = false;
      }
    }

    return new FullJudgment<Bits>(
      allCorrect,
      correctBits.join(""),
      charJudgments);
  }

  judgeText(guessText: string, winText: string): FullJudgment<Chars> {
    const guessBits = this.encodeText(guessText);
    const winBits = this.encodeText(winText);
    const bitJudgments = this.judgeBits(guessBits, winBits);
    const correctSplit = [...this.splitEncodedBits(bitJudgments.correctBits)];
    const correctChars = correctSplit
      .map(correctCharBits => this.decodeChar(correctCharBits))
      .join("");
    return new FullJudgment<Chars>(
      bitJudgments.isCorrect,
      correctChars,
      bitJudgments.charJudgments
    );
  }
}

export {VariableWidthEncoder};
