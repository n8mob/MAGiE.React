// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { ChocolateMode } from "../components/ChocolateMode";
import { FixedWidthEncoder } from "../encoding/FixedWidthEncoder";
import { fiveBitA1 } from "../encoding/FiveBitA1";
import { Puzzle } from "../model";

/*
 * Issue #231 — the clue used to be concatenated onto the front of winText and
 * encoded along with it.
 *
 * That quietly assumed every clue character had a code in the puzzle's encoding.
 * 5bA1 covers A-Z so it held; hex covers only 0-9 and A-F, so every other letter
 * in the clue encoded to the default and became a row no player could solve.
 *
 * These run in Taste (clock "none"), which has no conveyor — jsdom has no layout
 * engine, so the belt's measured scroll maths can't be exercised here. What is
 * covered is the separation itself and the row-index mapping that depends on it.
 */

vi.mock("../audio/SoundPlayer.ts", () => ({
  loadSound: vi.fn(() => Promise.resolve()),
  playSound: vi.fn(),
}));
vi.mock("react-ga4", () => ({ default: { event: vi.fn(), send: vi.fn() } }));

const HEX_MAP: Record<string, number> = {
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "A": 10, "B": 11, "C": 12, "D": 13, "E": 14, "F": 15,
};
const hexEncoder = new FixedWidthEncoder(4, HEX_MAP);

const puzzle = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  slug: "hex-1",
  init: "",
  clue: ["READ THE HEX", "IT SPELLS A WORD"],
  winText: "CAFE",
  winMessage: [],
  type: "Chocolate",
  clock: "none",
  encoding_name: "hex",
  encoding: hexEncoder,
  ...overrides,
});

const renderChocolate = (p: Puzzle) => render(<ChocolateMode puzzle={p} bitButtonWidthPx={40} />);

const clueRows = (container: HTMLElement) =>
  [...container.querySelectorAll(".bit-field p.conveyor-clue")];
const letterRows = (container: HTMLElement) =>
  [...container.querySelectorAll(".bit-field p.letter-correct, .bit-field p.letter-incorrect")];
const gutterLetters = (container: HTMLElement) =>
  letterRows(container).map(row => row.querySelector(".row-gutter")?.textContent ?? "");

afterEach(cleanup);

describe("Chocolate clue text (#231)", () => {
  it("encodes only the winText, not the clue", () => {
    const { container } = renderChocolate(puzzle());

    // "CAFE" is four letters. Concatenating the clue would have made it 32.
    expect(letterRows(container)).to.have.lengthOf(4);
  });

  it("shows each clue line as its own belt row", () => {
    const { container } = renderChocolate(puzzle());
    const rows = clueRows(container);

    expect(rows).to.have.lengthOf(2);
    expect(rows[0].textContent).to.contain("READ THE HEX");
    expect(rows[1].textContent).to.contain("IT SPELLS A WORD");
  });

  it("keeps the target gutter aligned with the winText past the clue rows", () => {
    const { container } = renderChocolate(puzzle());

    // The off-by-N this guards: gutter letters are looked up by rendered row
    // index, which the clue rows shift.
    expect(gutterLetters(container).join("")).to.equal("CAFE");
  });

  it("gives a clue row no bits to toggle and no target letter", () => {
    const { container } = renderChocolate(puzzle());
    const firstClue = clueRows(container)[0];

    expect(firstClue.querySelectorAll("input.bit-checkbox")).to.have.lengthOf(0);
    expect(firstClue.querySelector(".row-gutter")?.textContent ?? "").to.equal("");
  });

  it("renders no clue rows when the puzzle has no clue", () => {
    const { container } = renderChocolate(puzzle({ clue: [] }));

    expect(clueRows(container)).to.have.lengthOf(0);
    expect(gutterLetters(container).join("")).to.equal("CAFE");
  });

  it("skips blank clue lines rather than leaving a gap on the belt", () => {
    const { container } = renderChocolate(puzzle({ clue: ["READ THE HEX", "  ", ""] }));

    expect(clueRows(container)).to.have.lengthOf(1);
  });

  it("is not specific to hex — 5bA1 puzzles separate the same way", () => {
    const { container } = renderChocolate(puzzle({
      encoding: fiveBitA1,
      encoding_name: "5bA1",
      winText: "HI",
      clue: ["A GREETING"],
    }));

    expect(letterRows(container)).to.have.lengthOf(2);
    expect(gutterLetters(container).join("")).to.equal("HI");
    expect(clueRows(container)[0].textContent).to.contain("A GREETING");
  });
});
