import VariableWidthEncoder from "../VariableWidthEncoder.ts";
import {describe, expect, it, beforeEach} from "vitest";
import {CharJudgment, DisplayRowJudgment} from "../SequenceJudgment.ts";
import FullJudgment from "../FullJudgment.ts";

const simple3Bit = {
  "1": {
    "A": "1",
    "B": "11",
    "C": "111"
  },
  "0": {
    "": "0",
    " ": "00",
    ".": "000",
    ". ": "00000"
  }
};

describe('VariableWidthEncoder', () => {
  let unitUnderTest: VariableWidthEncoder;

  beforeEach(() => {
    unitUnderTest = new VariableWidthEncoder(simple3Bit);
  });

  it('should reverse the encoding to get the decoding', () => {
    expect(unitUnderTest.encoding).toEqual(simple3Bit);
    expect(unitUnderTest.decoding).toEqual({
      "1": {
        "1": "A",
        "11": "B",
        "111": "C"
      },
      "0": {
        "0": "",
        "00": " ",
        "000": ".",
        "00000": ". ",
      }
    });
  });

  it("should encode the letter 'A'", () => {
    const toEncode = 'A';
    const expected = '1';

    const actual = unitUnderTest.encodeChar(toEncode);
    expect(actual).toEqual(expected);
  });

  it("should decode the letter 'A' from '1'", () => {
    const expected = 'A';
    const encoded = '1';

    const actual = unitUnderTest.decodeChar(encoded);
    expect(actual).toEqual(expected);
  });

  it("should decode '0' as an empty string", () => {
    const expected = "";
    const encoded = "0";
    const actual = unitUnderTest.decodeChar(encoded);
    expect(actual).toEqual(expected);
  });


  it("should encode 'AB' to '1011'", () => {
    const toEncode = 'AB';
    const expected = '1011';

    const actual = unitUnderTest.encodeText(toEncode);
    expect(actual).toEqual(expected);
  });

  it("should decode 'BC' from '110111", () => {
    const expected = 'BC';
    const encoded = '110111';
    const actual = unitUnderTest.decodeText(encoded);
    expect(actual).toEqual(expected);
  });

  it("should decode 'A B' from '10011'", () => {
    const expected = 'A B';
    const encoded = '10011';
    const actual = unitUnderTest.decodeText(encoded);
    expect(actual).toEqual(expected);
  });

  it("should decode 'A. B' from '10000011'", () => {
    const expected = 'A. B';
    const encoded = '10000011';
    const actual = unitUnderTest.decodeText(encoded);
    expect(actual).toEqual(expected);
  });

  it("should decode '1111' as '?'", () => {
    const expected = '?';
    const encoded = '1111';
    const actual = unitUnderTest.decodeText(encoded);
    expect(actual).toEqual(expected);
  });

  it("should decode a string with a space", () => {
    const encodedSentence = "10011101011000";
    const expected = "A CAB.";
    const actual = unitUnderTest.decodeText(encodedSentence);
    expect(actual).toEqual(expected);
  });

  it("should encode period after text as '000'", () => {
    const text = "A CAB.";
    const expected = "10011101011000";
    const actual = unitUnderTest.encodeText(text);
    expect(actual).toEqual(expected);
  });

  it("should split whenever symbols change", () => {
    const encoded = "10011101011000"; // 'A CAB.'
    const expected = ["1", "00", "111", "1", "11", "000"]
    const actual = [...unitUnderTest.splitByChar(encoded)];
    expect(actual).toEqual(expected);
  });

  it("should split encoded text the same as raw bits", () => {
    const rawBits = "10011101011000";
    const text = "A CAB.";
    expect(unitUnderTest.decodeText(rawBits)).toEqual(text);

    const expectedSplit = ["1", "00", "111", "1", "11", "000"]

    const splitFromBits: string[] = [...unitUnderTest.splitByChar(rawBits)];
    expect(splitFromBits).toEqual(expectedSplit);

    const splitFromText = [...unitUnderTest.encodeAndSplit(text)];
    expect(splitFromText).toEqual(splitFromBits);
    expect(splitFromText).toEqual(expectedSplit);
  });

  it("should judge a single correct character", () => {
    const guessBits = "1111";
    const bitJudgments = "1111";
    const winBits = "1111"
    const rowJudgment = new DisplayRowJudgment(guessBits, bitJudgments);
    const expected = new FullJudgment(
      true,
      guessBits,
      [rowJudgment]);
    const actual = unitUnderTest.judgeBits(guessBits, winBits, 13);
    expect(actual).toEqual(expected);
  });

  it("should judge a string of correct characters", () => {
    const guessText = "A CAB.";
    const winText = "A CAB.";
    const expected = new FullJudgment(true, "A CAB.", [
      new CharJudgment("1", "1"),
      new CharJudgment("00", "11"),
      new CharJudgment("111", "111"),
      new CharJudgment("1", "1"),
      new CharJudgment("11", "11"),
      new CharJudgment("000", "111"),
    ]);
    const actual = unitUnderTest.judgeText(guessText, winText);
    expect(actual).toBeInstanceOf(FullJudgment<CharJudgment>);
    // make sure getCharJudgments is not empty and has the right elements in it.
    const expectedCharJudgments = expected.getCharJudgments();
    const actualCharJudgments = actual.getCharJudgments();
    let nextExpected = expectedCharJudgments.next();
    let nextActual = actualCharJudgments.next();
    while (!nextExpected.done) {
      expect(nextActual.value).toEqual(nextExpected.value);
      nextActual = actualCharJudgments.next();
      nextExpected = expectedCharJudgments.next();
    }
  });
});
