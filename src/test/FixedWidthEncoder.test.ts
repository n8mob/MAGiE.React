import { FixedWidthEncoder } from "../encoding/FixedWidthEncoder.ts";
import {beforeEach, describe, expect, it} from "vitest";
import { BitSequence } from "../BitSequence.ts";

const hexadecimal = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  'A': 10,
  'B': 11,
  'C': 12,
  'D': 13,
  'E': 14,
  'F': 15
};

describe('FixedWidthEncoder', () => {
  let unitUnderTest: FixedWidthEncoder;

  beforeEach(() => {
    unitUnderTest = new FixedWidthEncoder(4, hexadecimal);
  });

  it('should reverse the encoding to get the decoding', () => {
    expect(unitUnderTest.encoding).toEqual(hexadecimal);
    expect(unitUnderTest.decoding).toEqual({
        0: '0',
        1: '1',
        2: '2',
        3: '3',
        4: '4',
        5: '5',
        6: '6',
        7: '7',
        8: '8',
        9: '9',
        10: 'A',
        11: 'B',
        12: 'C',
        13: 'D',
        14: 'E',
        15: 'F'
      });
  });

  it('should encode "A" as "1010"', () => {
    const decoded = 'A';
    const encoded = '1010';

    const actual = unitUnderTest.encodeChar(decoded);
    expect(actual.toString()).to.equal(encoded);
  });

  it('should encode "1" as "0001"', () => {
    const decoded = '1';
    const expected = '0001';
    const actual = unitUnderTest.encodeChar(decoded);
    expect(actual.toString()).to.equal(expected);
  });

  it('should encode "AB" as "1010 1011', () => {
    const decoded = 'AB';
    const expected = '10101011';
    const actual = unitUnderTest.encodeText(decoded);
    expect(actual.toPlainString()).to.equal(expected);
  });

  it('should encode a string correctly', () => {
    const decoded = 'A1B2';
    const allExpectedCharBits = ['1010', '0001', '1011', '0010'];

    const actualSequences  = unitUnderTest.encodeText(decoded);
    expect(actualSequences.length).to.equal(allExpectedCharBits.join('').length);
    let sliceIndex = 0;

    allExpectedCharBits.forEach((expectedCharBits) => {
      const actualCharBits = actualSequences.slice(sliceIndex, sliceIndex + 4);
      expect(actualCharBits.toString()).to.equal(expectedCharBits);
      sliceIndex += 4;
    });

  });

  it('should decode a single character correctly', () => {
    const decoded = 'A';
    const encoded = BitSequence.fromString('1010');

    expect(unitUnderTest.decodeChar(encoded)).to.equal(decoded);
  });

  it('should decode a string correctly', () => {
    const decoded = 'A1B2';
    const encoded = BitSequence.fromString('1010000110110010');
    expect(unitUnderTest.decodeText(encoded)).to.equal(decoded);
  });

  it('should splitByChar into correct DisplayRows', () => {
    const encoded = BitSequence.fromString('1010000110110010'); // "A1B2"
    const chars = Array.from(unitUnderTest.splitByChar(encoded));
    expect(chars.length).to.equal(4);
    expect(chars[0].toPlainString()).to.equal('1010');
    expect(chars[1].toPlainString()).to.equal('0001');
    expect(chars[2].toPlainString()).to.equal('1011');
    expect(chars[3].toPlainString()).to.equal('0010');
    expect(chars[0].annotation).to.equal('A');
    expect(chars[1].annotation).to.equal('1');
    expect(chars[2].annotation).to.equal('B');
    expect(chars[3].annotation).to.equal('2');
  });

  it('should splitForDisplay into correct DisplayRows for full rows', () => {
    const encoded = BitSequence.fromString('1010000110110010'); // "A1B2"
    // displayWidth = 8, so 2 chars per row (4 bits per char)
    const rows = Array.from(unitUnderTest.splitForDisplay(encoded, 8));
    expect(rows.length).to.equal(2);
    expect(rows[0].toPlainString()).to.equal('10100001');
    expect(rows[0].annotation).to.equal('A1');
    expect(rows[1].toPlainString()).to.equal('10110010');
    expect(rows[1].annotation).to.equal('B2');
  });

  it('should splitForDisplay into correct DisplayRows for partial last row', () => {
    const encoded = BitSequence.fromString('101000011011'); // "A1B"
    // displayWidth = 8, so 2 chars per row, last row is partial
    const rows = Array.from(unitUnderTest.splitForDisplay(encoded, 8));
    expect(rows.length).to.equal(2);
    expect(rows[0].toPlainString()).to.equal('10100001');
    expect(rows[0].annotation).to.equal('A1');
    expect(rows[1].toPlainString()).to.equal('1011');
    expect(rows[1].annotation).to.equal('B');
  });

  it('should throw if displayWidth is too small for a character', () => {
    const encoded = BitSequence.fromString('1010');
    expect(() => Array.from(unitUnderTest.splitForDisplay(encoded, 2))).to.throw();
  });

});
