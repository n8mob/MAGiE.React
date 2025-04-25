import { describe, it, expect } from "vitest";
  import IndexedBit from "../IndexedBit";

  describe("IndexedBit", () => {
    it("should correctly initialize with bit and index", () => {
      const bit = new IndexedBit("1", 5);
      expect(bit.bit).toBe("1");
      expect(bit.index).toBe(5);
    });

    it("should allow undefined as a bit value", () => {
      const bit = new IndexedBit(undefined, 3);
      expect(bit.bit).toBeUndefined();
      expect(bit.index).toBe(3);
    });

    it("should return true for isChecked when bit is '1'", () => {
      const bit = new IndexedBit("1", 0);
      expect(bit.isChecked).toBe(true);
    });

    it("should return false for isChecked when bit is '0'", () => {
      const bit = new IndexedBit("0", 0);
      expect(bit.isChecked).toBe(false);
    });

    it("should return a space for toString when bit is undefined", () => {
      const bit = new IndexedBit(undefined, 0);
      expect(bit.toString()).toBe(" ");
    });

    it("should return the bit value for toString when bit is defined", () => {
      const bit = new IndexedBit("0", 0);
      expect(bit.toString()).toBe("0");
    });

    it("should correctly compare two IndexedBit instances with equals", () => {
      const bit1 = new IndexedBit("1", 3);
      const bit2 = new IndexedBit("1", 3);
      const bit3 = new IndexedBit("0", 3);
      const bit4 = new IndexedBit("1", 4);
      expect(bit1.equals(bit2)).toBe(true);
      expect(bit1.equals(bit3)).toBe(false);
      expect(bit1.equals(bit4)).toBe(false);
    });
  });