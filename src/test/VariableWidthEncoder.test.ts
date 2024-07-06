import {VariableWidthEncoder} from "../VariableWidthEncoder.ts";
import {describe, expect, it, beforeEach} from "vitest";

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
});