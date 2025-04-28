import { VariableWidthEncoder } from "../encoding/VariableWidthEncoder.ts";
import { beforeEach, describe, expect, it } from "vitest";
import { BitSequence } from "../BitSequence.ts";

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
    expect(unitUnderTest.encoding).to.deep.equal(simple3Bit);
    expect(unitUnderTest.decoding).to.deep.equal({
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

  it('should encode the letter "A"', () => {
    const toEncode = 'A';
    const expected = '1';

    const actual = unitUnderTest.encodeChar(toEncode);
    expect(actual.toString()).to.equal(expected);
  });

  it('should encode the letter "B" to "11"', () => {
    const toEncode = 'B';
    const expected = '11';

    const actual = unitUnderTest.encodeChar(toEncode);
    expect(actual.toString()).to.equal(expected);
  });

  it('should encode an empty string as "0"', () => {
    const toEncode = '';
    const expected = '0';

    const actual = unitUnderTest.encodeChar(toEncode);
    expect(actual.toString()).to.equal(expected);
  });

  it('should encode [space] as "00"', () => {
    const toEncode = ' ';
    const expected = '00';

    const actual = unitUnderTest.encodeChar(toEncode);
    expect(actual.toString()).to.equal(expected);
  });

  it ('should encode [period] as "000"', () => {
    const toEncode = '.';
    const expected = '000';

    const actual = unitUnderTest.encodeChar(toEncode);
    expect(actual.toString()).to.equal(expected);
  });

  it ('should encode [period][space] as "00000"', () => {
    const toEncode = '. ';
    const expected = '00000';

    const actual = unitUnderTest.encodeChar(toEncode);
    expect(actual.toString()).to.equal(expected);
  });

  it('should encode "A[space]" as "100"', () => {
    const toEncode = 'A ';
    const expected = '100';

    const actual = unitUnderTest.encodeText(toEncode).toPlainString();
    expect(actual.toString()).to.equal(expected);
  });

  it('should encode ".B" as "00011"', () => {
    const toEncode = '.B';
    const expected = '00011';
    const actual = unitUnderTest.encodeText(toEncode).toPlainString();
    expect(actual).to.equal(expected);
  });

  it ('given "AB", when encodeAndSplit, then return ["1", "0", "11"]', () => {
    const toEncode = 'AB';
    const expected = ['1', '11'];

    const actual = [...unitUnderTest.encodeAndSplit(toEncode)].map(seq => seq.toString());
    expect(actual).to.deep.equal(expected);
  });

  it('should encodeAndSplit "A[space]" as ["1", "00"]', () => {
    const toEncode = 'A ';
    const expected = ['1', '00'];

    const actual = [...unitUnderTest.encodeAndSplit(toEncode)].map(seq => seq.toString());
    expect(actual).to.deep.equal(expected);
  });

  it("should encode 'AB' to '1011'", () => {
    const toEncode = 'AB';
    const expected = '1011';

    const actual = unitUnderTest.encodeText(toEncode).toPlainString();
    expect(actual.length).to.equal(expected.length);
    expect(actual.toString()).to.equal(expected);
  });

  it("should decode the letter 'A' from '1'", () => {
    const expected = 'A';
    const encoded = BitSequence.fromString('1');

    const actual = unitUnderTest.decodeChar(encoded);
    expect(actual).to.equal(expected);
  });

  it("should decode '0' as an empty string", () => {
    const expected = '';
    const encoded = BitSequence.fromString('0');
    const actual = unitUnderTest.decodeChar(encoded);
    expect(actual).to.equal(expected);
  });

  it("should decode 'BC' from '110111'", () => {
    const expected = 'BC';
    const encoded = BitSequence.fromString('110111');
    const actual = unitUnderTest.decodeText(encoded);
    expect(actual).to.equal(expected);
  });

  it("should decode 'A B' from '10011'", () => {
    const expected = 'A B';
    const encoded = BitSequence.fromString('10011');
    const actual = unitUnderTest.decodeText(encoded);
    expect(actual).to.equal(expected);
  });

  it("should decode 'A. B' from '10000011'", () => {
    const expected = 'A. B';
    const encoded = BitSequence.fromString('10000011');
    const actual = unitUnderTest.decodeText(encoded);
    expect(actual).to.equal(expected);
  });

  it("should decode '1111' as '?'", () => {
    const expected = '?';
    const encoded = BitSequence.fromString('1111');
    const actual = unitUnderTest.decodeText(encoded);
    expect(actual).to.equal(expected);
  });

  it("should decode a string with a space", () => {
    const encodedSentence = BitSequence.fromString("10011101011000");
    const expected = "A CAB.";
    const actual = unitUnderTest.decodeText(encodedSentence);
    expect(actual).to.equal(expected);
  });

  it('should encode period after text as "000"', () => {
    const text = "A CAB.";
    const expected = "10011101011000";
    const actual = unitUnderTest.encodeText(text);
    expect(actual.toString()).to.equal(expected);
  });

  it('should return "done" when splitByChar on empty BitSequence', () => {
    const empty = BitSequence.empty();
    const expected = { done: true, value: undefined };
    const actual = unitUnderTest.splitByChar(empty).next();
    expect(actual).to.deep.equal(expected);
  });

  it("should include char separator when split by char", () => {
    const encoded = BitSequence.fromString("10011101011000"); // 'A CAB.'
    const expected = ["1", "00", "111", "0", "1", "0", "11", "000"];
    expect([...(unitUnderTest.splitByChar(encoded))].map(seq => seq.toString())).to.deep.equal(expected);
  });

  it("should not include char separator when encodeAndSplit text", () => {
    const expected = ["1", "00", "111", "1", "11", "000"];
    expect([...(unitUnderTest.encodeAndSplit("A CAB."))].map(seq => seq.toString())).to.deep.equal(expected);
  });

  it('should return two rows: "1001", "1000" when splitForDisplay(encodeText("A B."))', () => {
    const encoded = BitSequence.fromString('10011000');
    // displayWidth = 4, so 2 rows: "1001" and "1000"
    const rows = Array.from(unitUnderTest.splitForDisplay(encoded, 4));
    expect(rows.length).to.equal(2);
    expect(rows[0].toPlainString()).to.equal('1001');
    expect(rows[1].toPlainString()).to.equal('1000');
  });

  it('should splitForDisplay into correct DisplayRows for partial last row', () => {
    // "A B" => "1 00 11" => "10011"
    const encoded = BitSequence.fromString('10011');
    // displayWidth = 4, so first row is "1001", last row is "1"
    const rows = Array.from(unitUnderTest.splitForDisplay(encoded, 4));
    expect(rows.length).to.equal(2);
    expect(rows[0].toPlainString()).to.equal('1001');
    expect(rows[1].toPlainString()).to.equal('1');
  });

  it('should throw if displayWidth is too small', () => {
    const encoded = BitSequence.fromString('1');
    expect(() => Array.from(unitUnderTest.splitForDisplay(encoded, 0))).to.throw();
    expect(() => Array.from(unitUnderTest.splitForDisplay(encoded, -1))).to.throw();
  });

});

