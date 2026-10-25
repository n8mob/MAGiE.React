// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { TwoShotPuzzle } from "../components/TwoShotPuzzle";
import { splitIntoShots } from "../twoShot";
import { fiveBitA1 } from "../encoding/FiveBitA1";
import { Puzzle } from "../model";

vi.mock("../audio/SoundPlayer.ts", () => ({
  loadSound: vi.fn(() => Promise.resolve()),
  playSound: vi.fn(),
}));
vi.mock("react-ga4", () => ({ default: { event: vi.fn(), send: vi.fn() } }));

const puzzle = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  slug: "p-1",
  init: "",
  clue: ["A  GREETING", "FOR YOU"],
  winText: "HI",
  winMessage: ["WELL DONE"],
  type: "Decode",
  encoding_name: "5bA1",
  encoding: fiveBitA1,
  ...overrides,
});

const typeText = (text: string) => {
  for (const character of text) {
    fireEvent.keyDown(window, { key: character });
  }
};

const typeBits = (text: string) => {
  for (const bit of fiveBitA1.encodeText(text).toString()) {
    fireEvent.keyDown(window, { key: bit });
  }
};

const button = (container: HTMLElement, label: RegExp) =>
  [...container.querySelectorAll("button")].find(b => label.test(b.textContent ?? ""));

describe("splitIntoShots", () => {
  it("decodes the joined, collapsed clue, then encodes the answer", () => {
    const { decodeShot, finalShot } = splitIntoShots(puzzle());

    expect(decodeShot).toMatchObject({
      type: "Decode",
      init: "",
      winText: "A GREETING FOR YOU",
      clue: ["decode the bits"],
      winMessage: ["Good.", "Now", "encode a response."],
    });
    expect(finalShot).toMatchObject({
      type: "Encode",
      clue: ["A  GREETING", "FOR YOU"],
      winText: "HI",
      winMessage: ["WELL DONE"],
    });
  });

  it("skips the decode shot when the clue has characters the keyboard can't type", () => {
    const { decodeShot, finalShot } = splitIntoShots(puzzle({ clue: ["1 = ON"] }));
    expect(decodeShot).toBeNull();
    expect(finalShot.type).toBe("Encode");
  });

  it("passes auto-win demo screens through untouched", () => {
    const demo = puzzle({ init: "HI" });
    expect(splitIntoShots(demo)).toEqual({ decodeShot: null, finalShot: demo });
  });
});

describe("TwoShotPuzzle", () => {
  beforeEach(() => {
    // jsdom has no layout, so no scrolling either.
    Element.prototype.scrollTo = vi.fn();
  });
  afterEach(cleanup);

  it("only reports the win after both shots", () => {
    const onWin = vi.fn();
    const { container } = render(
      <TwoShotPuzzle
        puzzle={puzzle()}
        onWin={onWin}
        winActions={<button type="button">Next ▶▶</button>}
        bitButtonWidthPx={32}
      />
    );

    typeText("A GREETING FOR YOU");
    expect(onWin).not.toHaveBeenCalled();
    expect(container.textContent).toMatch(/encode a response/i);

    fireEvent.click(button(container, /next shot/i)!, { detail: 0 });
    expect(container.querySelector("#clue-text")?.textContent).toMatch(/A {2}GREETING/);

    typeBits("HI");
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(button(container, /next ▶▶/i)).toBeDefined();
  });
});
