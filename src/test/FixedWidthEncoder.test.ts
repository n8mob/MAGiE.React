import {FixedWidth} from "../Encoding.ts";
import {describe, expect, it} from "vitest";

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
  it('should reverse the encoding to get the decoding', () => {
    const encoder = new FixedWidth(4, hexadecimal);
    expect(encoder.encoding).toEqual(hexadecimal);
    expect(encoder.decoding).toEqual({
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

  it('should encode a single character correctly', () => {
    const encoder = new FixedWidth(4, hexadecimal);
    const decoded = 'A';
    const encoded = '1010';

    expect(encoder.encodeChar(decoded)).equal(encoded);
  });

  it('should encode a string correctly', () => {
    const encoder = new FixedWidth(4, hexadecimal);
    const decoded = 'A1B2';

    const encoded = '1010000110110010';

    expect(encoder.encodeText(decoded)).equal(encoded);
  });

  it('should decode a single character correctly', () => {
    const encoder = new FixedWidth(4, hexadecimal);
    const decoded = 'A';
    const encoded = '1010';

    expect(encoder.decodeChar(encoded)).equal(decoded);
  });

  it('should decode a string correctly', () => {
    const encoder = new FixedWidth(4, hexadecimal);
    const decoded = 'A1B2';
    const encoded = '1010000110110010';
    expect(encoder.decodeText(encoded)).equal(decoded);
  });
});
