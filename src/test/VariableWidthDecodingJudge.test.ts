import { CharJudgment, SequenceJudgment } from "../judgment/SequenceJudgment.ts";
import { FullJudgment } from "../judgment/FullJudgment.ts";
import { VariableWidthDecodingJudge } from "../judgment/VariableWidthDecodingJudge.ts";
import { beforeEach, describe, expect, it } from "vitest";
import { VariableWidthEncoder } from "../encoding/VariableWidthEncoder.ts";
import { BitSequence } from "../BitSequence.ts";

describe('VariableWidthDecodingJudge', () => {
  let testEncoder: VariableWidthEncoder;
  let unitUnderTest: VariableWidthDecodingJudge;
  const split = function* (bits: BitSequence) {
    let b2: BitSequence = bits;
    const sliceWidth = 13;
    let sliceCount = 1;
    while (b2 && b2.length > 0) {
      const slice: BitSequence = b2.slice(0, sliceWidth * sliceCount++);
      yield slice;
      b2 = b2.slice(sliceWidth);
    }
  };

  beforeEach(() => {
    testEncoder = new VariableWidthEncoder(
      {
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
      }
    );

    unitUnderTest = new VariableWidthDecodingJudge(testEncoder);
  });

  it("should judge a single correct character", () => {
    const correctBitString = "1111";
    const guessBits = BitSequence.fromString(correctBitString);
    const winBits = BitSequence.fromString(correctBitString);
    const fourCorrect = "1111";
    const rowJudgment = new SequenceJudgment(guessBits, fourCorrect);
    const expected = new FullJudgment(
      true,
      guessBits,
      [rowJudgment]
    );
    const actual = unitUnderTest.judgeBits(guessBits, winBits, split);
    expect(actual).to.deep.equal(expected);
  });

  // noinspection DuplicatedCode
  it("should judge a string of correct characters", () => {
    const guessText = "A CAB.";
    const winText = "A CAB.";
    const guessBits = testEncoder.encodeText(guessText);
    const actual = unitUnderTest.judgeText(guessText, winText);
    expect(actual).to.be.instanceof(FullJudgment<CharJudgment>);
    expect(actual.isCorrect).to.be.true;
    expect(actual.correctGuess.equals(guessBits)).to.be.true;
    const charJudgments = actual.getCharJudgments();
    let nextCharJudgment = charJudgments.next();
    while(!nextCharJudgment.done) {
      nextCharJudgment.value.bitJudgments.forEach(bitJudgment => {
        expect(bitJudgment.isCorrect).to.be.true;
      })
      nextCharJudgment = charJudgments.next();
    }
  });
});

