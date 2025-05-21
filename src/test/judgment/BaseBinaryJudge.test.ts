import { describe, expect, it } from "vitest";
import { BaseBinaryJudge } from "../../judgment/BinaryJudge.ts";
import { FullJudgment } from "../../judgment/FullJudgment.ts";
import { SequenceJudgment } from "../../judgment/SequenceJudgment.ts";
import { BitSequence } from "../../BitSequence.ts";
import { BitJudgment, Correctness } from "../../judgment/BitJudgment.ts";
import { IndexedBit } from "../../IndexedBit.ts";

const judgeMissingGuessAsHidden = (guessBit?: IndexedBit, winBit?: IndexedBit): BitJudgment => {
  if (!guessBit) {
    return new BitJudgment(winBit!, Correctness.hidden);
  } else if (!winBit) {
    return new BitJudgment(guessBit, Correctness.incorrect);
  }
  return new BitJudgment(
    guessBit,
    winBit.equals(guessBit) ? Correctness.correct : Correctness.incorrect
  );
};

const newSequenceJudgment = (bits: BitSequence, judgments: BitJudgment[] | string): SequenceJudgment => {
  return new SequenceJudgment(bits, judgments);
}

// Test implementation of BaseBinaryJudge
class TestBinaryJudge extends BaseBinaryJudge {
  judgeText(guessText: string, winText: string): FullJudgment {
    const guessBits = BitSequence.fromString(guessText);
    const winBits = BitSequence.fromString(winText);

    return this.judgeBits(
      guessBits,
      winBits,
      (bits) => this.splitByChar(bits),
      this.bitJudge,
      newSequenceJudgment
    );
  }

  private splitByChar(bits: BitSequence) {
    function* generator() {
      for (let i = 0; i < bits.length; i += 4) {
        yield bits.slice(i, i + 4);
      }
    }

    return generator();
  }

  public bitJudge(guessBit?: IndexedBit, winBit?: IndexedBit): BitJudgment {
    if (!guessBit) {
      return new BitJudgment(winBit!, Correctness.hidden);
    } else if (!winBit) {
      return new BitJudgment(guessBit, Correctness.incorrect);
    }
    return new BitJudgment(
      guessBit,
      winBit.equals(guessBit) ? Correctness.correct : Correctness.incorrect
    );
  }
}

describe("BaseBinaryJudge", () => {
  const unitUnderTest = new TestBinaryJudge();

  it("should include sequenceJudgment even for mismatches", () => {
    const guessText = "1111"; // mismatched with win
    const winText = "0000";

    const judgment = unitUnderTest.judgeText(guessText, winText);

    // This would have failed pre-fix because sequenceJudgments was never populated
    expect(judgment.sequenceJudgments.length).to.equal(1); // <- fails before fix
    expect(judgment.sequenceJudgments[0].bitJudgments.every(j => j.correctness === Correctness.incorrect)).to.be.true;
  });


  it("should judge bits correctly for matching sequences", () => {
    const guess = BitSequence.fromString("1010");
    const win = BitSequence.fromString("1010");
    const judgment = unitUnderTest.judgeBits(
      guess,
      win,
      (bits) => unitUnderTest["splitByChar"](bits),
      unitUnderTest["bitJudge"],
      newSequenceJudgment
    );

    expect(judgment.isCorrect).to.be.true;
    expect(judgment.correctGuess.equals(guess)).to.be.true;
  });

  it("should judge bits correctly for mismatched sequences", () => {
    const guess = BitSequence.fromString("1010");
    const win = BitSequence.fromString("1001");
    const actual = unitUnderTest.judgeBits(
      guess,
      win,
      (bits) => unitUnderTest["splitByChar"](bits),
      unitUnderTest["bitJudge"],
      newSequenceJudgment
    );

    expect(actual.isCorrect).to.be.false;
    expect(actual.correctGuess.equals(BitSequence.fromString("10"))).to.be.true;
  });

  it ("should handle guess shorter than win with remaining bits hidden", () => {
    const guess = BitSequence.fromString("1010");
    const win = BitSequence.fromString("101011");
    const judgment = unitUnderTest.judgeBits(
      guess,
      win,
      (bits) => unitUnderTest["splitByChar"](bits),
      judgeMissingGuessAsHidden,
      newSequenceJudgment
    );

    expect(judgment.isCorrect).to.be.false;
    expect(judgment.sequenceJudgments).to.have.lengthOf(2);
    expect(judgment.sequenceJudgments[1].bitJudgments.every(j => j.correctness === Correctness.hidden)).to.be.true;
  })

  it("should handle guess longer than win", () => {
    const guess = BitSequence.fromString("101011");
    const win = BitSequence.fromString("1010");
    const actual = unitUnderTest.judgeBits(
      guess,
      win,
      (bits) => unitUnderTest["splitByChar"](bits),
      unitUnderTest["bitJudge"],
      newSequenceJudgment
    );

    expect(actual.isCorrect).to.be.false;
    expect(actual.sequenceJudgments).to.have.lengthOf(2);
    expect(actual.sequenceJudgments[1].bitJudgments.every(j => j.correctness === Correctness.incorrect)).to.be.true;
  });

  it("should handle win longer than guess", () => {
    const guess = BitSequence.fromString("1010");
    const win = BitSequence.fromString("101011");
    const judgment = unitUnderTest.judgeBits(
      guess,
      win,
      (bits) => unitUnderTest["splitByChar"](bits),
      unitUnderTest["bitJudge"],
      newSequenceJudgment
    );

    expect(judgment.isCorrect).to.be.false;
    expect(judgment.sequenceJudgments).to.have.lengthOf(2);
    expect(judgment.sequenceJudgments[1].bitJudgments.every(j => j.correctness === Correctness.hidden)).to.be.true;
  });

  it("should judge text correctly for matching strings", () => {
    const guessText = "1010";
    const winText = "1010";
    const judgment = unitUnderTest.judgeText(guessText, winText);

    expect(judgment.isCorrect).to.be.true;
    expect(judgment.correctGuess.equals(BitSequence.fromString(guessText))).to.be.true;
  });

  it("should judge text correctly for mismatched strings", () => {
    const guessText = "1010";
    const winText = "1001";
    const judgment = unitUnderTest.judgeText(guessText, winText);

    expect(judgment.isCorrect).to.be.false;
    expect(judgment.correctGuess.equals(BitSequence.fromString("10"))).to.be.true;
  });
});
