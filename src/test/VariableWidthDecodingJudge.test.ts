import {CharJudgment, DisplayRowJudgment} from "../judgment/SequenceJudgment.ts";
import FullJudgment from "../judgment/FullJudgment.ts";
import VariableWidthDecodingJudge from "../judgment/VariableWidthDecodingJudge.ts";
import {beforeEach, describe, expect, it} from "vitest";
import VariableWidthEncoder from "../encoding/VariableWidthEncoder.ts";

describe('VariableWidthDecodingJudge', () => {
  let unitUnderTest: VariableWidthDecodingJudge;

  beforeEach(() => {
    const encoder: VariableWidthEncoder = new VariableWidthEncoder({
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
    });

    unitUnderTest = new VariableWidthDecodingJudge(encoder);
  });

  it("should judge a single correct character", () => {
    const guessBits = "1111";
    const bitJudgments = "1111";
    const winBits = "1111"
    const rowJudgment = new DisplayRowJudgment(guessBits, bitJudgments);
    const expected = new FullJudgment(
      true,
      guessBits,
      [rowJudgment]
    );
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
