import { describe, expect, it } from "vitest";
import { IndexedBit } from "../IndexedBit";

describe("IndexedBit", () => {
    it("should correctly initialize with bit and index", () => {
      const bit = new IndexedBit("1", 5);
      expect(bit.bit).to.equal("1");
      expect(bit.index).to.equal(5);
    });

    it("should allow undefined as a bit value", () => {
      const bit = new IndexedBit(undefined, 3);
      expect(bit.bit).to.be.undefined;
      expect(bit.index).to.equal(3);
    });

    it("should return true for isChecked when bit is '1'", () => {
      const bit = new IndexedBit("1", 0);
      expect(bit.isChecked).to.be.true;
    });

    it("should return false for isChecked when bit is '0'", () => {
      const bit = new IndexedBit("0", 0);
      expect(bit.isChecked).to.be.false;
    });

    it("should return a space for toString when bit is undefined", () => {
      const bit = new IndexedBit(undefined, 0);
      expect(bit.toString()).to.equal(" ");
    });

    it("should return the bit value for toString when bit is defined", () => {
      const bit = new IndexedBit("0", 0);
      expect(bit.toString()).to.equal("0");
    });

    it("should correctly compare two IndexedBit instances with equals", () => {
      const bit1 = new IndexedBit("1", 3);
      const bit2 = new IndexedBit("1", 3);
      const bit3 = new IndexedBit("0", 3);
      const bit4 = new IndexedBit("1", 4);
      expect(bit1.equals(bit2)).to.be.true;
      expect(bit1.equals(bit3)).to.be.false;
      expect(bit1.equals(bit4)).to.be.false;
    });

    it("should compare with string using equals", () => {
      const bit = new IndexedBit("1", 2);
      expect(bit.equals("1")).to.be.true;
      expect(bit.equals("0")).to.be.false;
    });

    it("should compare with undefined using equals", () => {
      const bitUndef = new IndexedBit(undefined, 2);
      expect(bitUndef.equals("1")).to.be.false;
      expect(bitUndef.equals("0")).to.be.false;
      // noinspection TypeScriptValidateTypes
      expect(bitUndef.equals(undefined as any)).to.be.false;
    });

    it("should compare with null using equals", () => {
      const bit = new IndexedBit("1", 2);
      // noinspection TypeScriptValidateTypes
      expect(bit.equals(null as any)).to.be.false;
    });

    it("should compare with an object without bit using equals", () => {
      const bit = new IndexedBit("1", 2);
      const objWithoutBit = { index: 2 };
      // noinspection TypeScriptValidateTypes
      expect(bit.equals(objWithoutBit as any)).to.be.false;
    });

    it("should compare with an object without index using equals", () => {
      const bit = new IndexedBit("1", 2);
      const objWithoutIndex = { bit: "1" };
      expect(bit.equals(objWithoutIndex as any)).to.be.false;
    });

    it("should create a true bit at index using trueAtIndex", () => {
      const bit = IndexedBit.trueAtIndex(7);
      expect(bit.bit).to.equal("1");
      expect(bit.index).to.equal(7);
      expect(bit.isChecked).to.be.true;
    });

    it("should create a false bit at index using falseAtIndex", () => {
      const bit = IndexedBit.falseAtIndex(8);
      expect(bit.bit).to.equal("0");
      expect(bit.index).to.equal(8);
      expect(bit.isChecked).to.be.false;
    });
  });

