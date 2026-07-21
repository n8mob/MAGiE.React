import { describe, expect, it } from "vitest";
import { diffBitSounds } from "../audio/bitSoundDiff.ts";

describe("diffBitSounds", () => {
  it("is silent when nothing changed", () => {
    expect(diffBitSounds("0101", "0101")).toBeNull();
    expect(diffBitSounds("", "")).toBeNull();
  });

  it("taps on when a bit is toggled up", () => {
    expect(diffBitSounds("0000", "0010")).toBe("on");
  });

  it("taps off when a bit is toggled down", () => {
    expect(diffBitSounds("0010", "0000")).toBe("off");
  });

  it("taps on when a 1 is appended, off when a 0 is appended", () => {
    expect(diffBitSounds("01", "011")).toBe("on");
    expect(diffBitSounds("01", "010")).toBe("off");
  });

  it("taps off on backspace", () => {
    expect(diffBitSounds("0110", "011")).toBe("off");
    expect(diffBitSounds("0111", "011")).toBe("off");
  });

  it("prefers the on tap when a single change does both", () => {
    // Toggling one bit up and another down in the same update is rare, but the
    // on-tap is the more informative of the two.
    expect(diffBitSounds("0110", "1010")).toBe("on");
  });

  it("treats an unguessed blank bit filling in as an on tap", () => {
    expect(diffBitSounds("  ", " 1")).toBe("on");
    expect(diffBitSounds(" 1", "  ")).toBe("off");
  });

  it("handles growth from empty", () => {
    expect(diffBitSounds("", "1")).toBe("on");
    expect(diffBitSounds("", "0")).toBe("off");
  });
});
