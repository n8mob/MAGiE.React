import { describe, it, expect } from "vitest";
import { DisplayRow } from "../../encoding/DisplayRow";
import { IndexedBit } from "../../IndexedBit";
import { BitSequence } from "../../BitSequence";

  describe("DisplayRow", () => {
    it("should construct with bits and annotation", () => {
      const bits = [new IndexedBit("1", 0), new IndexedBit("0", 1)];
      const row = new DisplayRow(bits, "row1");
      expect(row.annotation).to.equal("row1");
      expect(row.toString()).to.equal("10 row1");
    });

    it("should construct with BitSequence", () => {
      const seq = BitSequence.fromString("101");
      const row = new DisplayRow(seq, "seq");
      expect(row.toString()).to.equal("101 seq");
    });

    it("should default annotation to empty string", () => {
      const bits = [new IndexedBit("1", 0)];
      const row = new DisplayRow(bits);
      expect(row.annotation).to.equal("");
      expect(row.toString()).to.equal("1");
    });

    it("toString should trim trailing space if annotation is empty", () => {
      const bits = [new IndexedBit("0", 0)];
      const row = new DisplayRow(bits, "");
      expect(row.toString()).to.equal("0");
    });

    it("fromString should create DisplayRow with correct bits and annotation", () => {
      const row = DisplayRow.fromString("1100", 2, "foo");
      expect(row.annotation).to.equal("foo");
      expect(row.toString()).to.equal("1100 foo");
      expect(row.getBit(0).index).to.equal(2);
      expect(row.getBit(1).index).to.equal(3);
    });

    it("fromString should default annotation to empty string", () => {
      const row = DisplayRow.fromString("01");
      expect(row.annotation).to.equal("");
      expect(row.toString()).to.equal("01");
    });
  });

