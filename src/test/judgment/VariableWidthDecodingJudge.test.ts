import { SequenceJudgment } from "../../judgment/SequenceJudgment.ts";
import { FullJudgment } from "../../judgment/FullJudgment.ts";
import { VariableWidthDecodingJudge } from "../../judgment/VariableWidthDecodingJudge.ts";
import { beforeEach, describe, expect, it } from "vitest";
import { VariableWidthEncoder } from "../../encoding/VariableWidthEncoder.ts";
import { BitSequence } from "../../BitSequence.ts";

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
    expect(actual).to.be.instanceof(FullJudgment);
    expect(actual.isCorrect).to.be.true;
    expect(actual.correctGuess.equals(guessBits)).to.be.true;
    const charJudgments = actual.getCharJudgments();
    let nextCharJudgment = charJudgments.next();
    while (!nextCharJudgment.done) {
      nextCharJudgment.value.bitJudgments.forEach(bitJudgment => {
        expect(bitJudgment.isCorrect).to.be.true;
      })
      nextCharJudgment = charJudgments.next();
    }
  });

  it("should judge a string with incorrect characters", () => {
    const guessText = "A CAB.";
    const winText = "A CCB.";
    const actual = unitUnderTest.judgeText(guessText, winText);
    expect(actual).to.be.instanceof(FullJudgment);
    expect(actual.isCorrect).to.be.false;
    expect(actual.correctGuess.toPlainString()).to.equal("100111010");
  });

  it("should judge a string with missing characters", () => {
    const guessText = "A CAB.";
    const winText = "A CAB. A";
    const actual = unitUnderTest.judgeText(guessText, winText);
    expect(actual).to.be.instanceof(FullJudgment);
    expect(actual.isCorrect).to.be.false;
    expect(actual.correctGuess.toPlainString()).to.equal("10011101011000");
  });

  it("should judge a string with extra characters", () => {
    const guessText = "A CAB. A";
    const winText = "A CAB.";
    const actual = unitUnderTest.judgeText(guessText, winText);
    expect(actual).to.be.instanceof(FullJudgment);
    expect(actual.isCorrect).to.be.false;
    expect(actual.correctGuess.toPlainString()).to.equal("10011101011000");
    const charJudgments = [...actual.getCharJudgments()];
    expect(charJudgments.length).to.equal(9);
    expect(charJudgments[0].isSequenceCorrect).to.be.true;
    expect(charJudgments[0].guess.toPlainString()).to.equal("1");
    expect(charJudgments[1].isSequenceCorrect).to.be.true;
    expect(charJudgments[1].guess.toPlainString()).to.equal("00");
    expect(charJudgments[2].isSequenceCorrect).to.be.true;
    expect(charJudgments[2].guess.toPlainString()).to.equal("111");
    expect(charJudgments[3].isSequenceCorrect).to.be.true;
    expect(charJudgments[3].guess.toPlainString()).to.equal("0");
    expect(charJudgments[4].isSequenceCorrect).to.be.true;
    expect(charJudgments[4].guess.toPlainString()).to.equal("1");
    expect(charJudgments[5].isSequenceCorrect).to.be.true;
    expect(charJudgments[5].guess.toPlainString()).to.equal("0");
    expect(charJudgments[6].isSequenceCorrect).to.be.true;
    expect(charJudgments[6].guess.toPlainString()).to.equal("11");
    expect(charJudgments[7].isSequenceCorrect).to.be.true;
    expect(charJudgments[7].bitJudgments.length).to.equal(3);
    expect(charJudgments[8].isSequenceCorrect).to.be.false;
  });
});

