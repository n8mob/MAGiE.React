import { describe, expect, it } from "vitest";
import { chocolateEncoding, fiveBitA1 } from "../../encoding/FiveBitA1.ts";
import { FixedWidthEncoder } from "../../encoding/FixedWidthEncoder.ts";
import { VariableWidthEncoder } from "../../encoding/VariableWidthEncoder.ts";
import { BitSequence } from "../../BitSequence.ts";

describe('fiveBitA1', () => {
  it('encodes space as all bits off', () => {
    expect(fiveBitA1.encodeText(" ").toPlainString()).to.equal("00000");
  });

  it('encodes A=1 through Z=26', () => {
    expect(fiveBitA1.encodeText("A").toPlainString()).to.equal("00001");
    expect(fiveBitA1.encodeText("Z").toPlainString()).to.equal("11010");
  });

  it('round-trips a message with spaces', () => {
    const message = "MEET ME AT THE FOUNTAIN";
    expect(fiveBitA1.decodeText(fiveBitA1.encodeText(message))).to.equal(message);
  });

  it('encodes unknown characters as all bits off', () => {
    expect(fiveBitA1.encodeText("?").toPlainString()).to.equal("00000");
  });

  it('splits by char into five-bit letters', () => {
    const bits = fiveBitA1.encodeText("AB");
    const letters = [...fiveBitA1.splitByChar(bits)];
    expect(letters).to.have.lengthOf(2);
    expect(letters[0].length).to.equal(5);
    expect(letters[1].length).to.equal(5);
  });
});

describe('chocolateEncoding', () => {
  it('keeps a fixed-width encoding as-is', () => {
    const hex = new FixedWidthEncoder(4, { '0': 0, '1': 1 });
    expect(chocolateEncoding(hex)).to.equal(hex);
    expect(chocolateEncoding(fiveBitA1)).to.equal(fiveBitA1);
  });

  it('substitutes 5bA1 for a variable-width encoding', () => {
    const alphaLength = new VariableWidthEncoder({ "0": { "a": "0" }, "1": { "b": "1" } });
    expect(chocolateEncoding(alphaLength)).to.equal(fiveBitA1);
  });

  it('substitutes 5bA1 for a missing encoding', () => {
    expect(chocolateEncoding(undefined)).to.equal(fiveBitA1);
  });

  it('always returns an encoding whose all-off letter decodes to a space', () => {
    const encoding = chocolateEncoding(undefined);
    expect(encoding.decodeChar(BitSequence.fromString("00000"))).to.equal(" ");
  });
});
