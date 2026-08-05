// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { EncodePuzzle } from "../components/EncodePuzzle";
import { DecodePuzzle } from "../components/DecodePuzzle";
import { fiveBitA1 } from "../encoding/FiveBitA1";
import { isTutorialContent } from "../tutorialContent";
import { Puzzle } from "../model";

/*
 * Encode and Decode present a win the player earned on the shared WinScreen
 * (#227), the same surface Chocolate uses.
 *
 * The tutorial's auto-win screens are deliberately exempt. Of the 40 auto-win
 * puzzles in docs/VintagePuzzles.json, 33 carry no winMessage at all — their
 * whole content is the clue — and the 7 that do use it to caption the bits
 * rendered above it ("THIS IS A BIT" / "IT IS .ON."). A top-layer dialog there
 * would cover the very thing the screen exists to show, so those keep the inline
 * panel and the plain after-win controls they have always had.
 */

vi.mock("../audio/SoundPlayer.ts", () => ({
  loadSound: vi.fn(() => Promise.resolve()),
  playSound: vi.fn(),
}));
vi.mock("react-ga4", () => ({ default: { event: vi.fn(), send: vi.fn() } }));

const puzzle = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  slug: "p-1",
  init: "",
  clue: ["A GREETING"],
  winText: "HI",
  winMessage: ["WELL DONE"],
  type: "Decode",
  encoding_name: "5bA1",
  encoding: fiveBitA1,
  ...overrides,
});

const nextButton = <button type="button">Next ▶▶</button>;

const dialog = (container: HTMLElement) =>
  container.querySelector<HTMLDialogElement>("dialog.win-screen");
const isShowing = (container: HTMLElement) => !!dialog(container)?.hasAttribute("open");
const winMessagePanel = (container: HTMLElement) => container.querySelector("#win-message");
const nextButtons = (container: HTMLElement) =>
  [...container.querySelectorAll("button")].filter(b => /next/i.test(b.textContent ?? ""));

/** Type the answer as prose — Decode judges on every keystroke. */
const typeText = (text: string) => {
  for (const character of text) {
    fireEvent.keyDown(window, { key: character });
  }
};

/** Type the answer as bits — Encode appends on 0/1. */
const typeBits = (text: string) => {
  for (const bit of fiveBitA1.encodeText(text).toString()) {
    fireEvent.keyDown(window, { key: bit });
  }
};

beforeEach(() => {
  // No layout engine in jsdom, and useBasePuzzle scrolls the display as rows are
  // judged. Neither of these exists there; both are no-ops for what is asserted.
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.scrollTo = vi.fn();
});
afterEach(cleanup);

describe("a win the player earned (#227)", () => {
  it("opens the win screen for Decode, with the route's controls on it", () => {
    const { container } = render(
      <DecodePuzzle puzzle={puzzle()} bitButtonWidthPx={32} winActions={nextButton} />
    );
    expect(isShowing(container)).to.equal(false);

    typeText("HI");

    expect(isShowing(container)).to.equal(true);
    // On the screen, not under the puzzle — that is the whole point of moving it.
    expect(nextButtons(dialog(container)!)).to.have.lengthOf(1);
    expect(dialog(container)?.textContent).to.contain("WELL DONE");
  });

  it("opens the win screen for Encode, with the route's controls on it", () => {
    const { container } = render(
      <EncodePuzzle puzzle={puzzle({ type: "Encode" })} bitButtonWidthPx={32} winActions={nextButton} />
    );
    expect(isShowing(container)).to.equal(false);

    typeBits("HI");

    expect(isShowing(container)).to.equal(true);
    expect(nextButtons(dialog(container)!)).to.have.lengthOf(1);
  });

  it("takes the on-screen keyboard away once there is nothing left to type", () => {
    const { container } = render(<DecodePuzzle puzzle={puzzle()} bitButtonWidthPx={32} />);
    expect(container.querySelector(".keyboard")).to.not.equal(null);

    typeText("HI");

    expect(container.querySelector(".keyboard")).to.equal(null);
  });
});

describe("tutorial content keeps its win inline", () => {
  it("gives a tutorial puzzle no dialog even on a win it earned", () => {
    const { container } = render(
      <DecodePuzzle puzzle={puzzle()} bitButtonWidthPx={32} winActions={nextButton} winInline={true} />
    );

    typeText("HI");

    // Its lessons point at the bit grid — "SEE HOW THE BIT WENT FROM PURPLE TO
    // GREEN?" — so a modal would cover the thing being taught.
    expect(dialog(container)).to.equal(null);
    expect(winMessagePanel(container)?.textContent).to.contain("WELL DONE");
    expect(nextButtons(container)[0].closest("dialog")).to.equal(null);
  });

  it("still gives the same puzzle a win screen outside the tutorial", () => {
    const { container } = render(
      <DecodePuzzle puzzle={puzzle()} bitButtonWidthPx={32} winActions={nextButton} />
    );

    typeText("HI");

    expect(isShowing(container)).to.equal(true);
  });
});

describe("isTutorialContent", () => {
  it("matches wherever the word turns up", () => {
    expect(isTutorialContent("tutorial")).to.equal(true);
    expect(isTutorialContent(undefined, "Tutorial-June2025")).to.equal(true);
    expect(isTutorialContent(null, undefined, "How To Play", "", "tutorial-demo-1")).to.equal(true);
  });

  it("does not match the checked-in vintage content, which never says it", () => {
    // Worth pinning: in docs/VintagePuzzles.json the word appears in no menu
    // name, category, level slug or puzzle slug. Only the route says "tutorial",
    // which is why menuName is passed in as the first candidate.
    expect(isTutorialContent(
      "bigGame", "VintagePuzzles", "Bits Intro", "THIS IS A BIT", "this-is-a-bit-combo",
    )).to.equal(false);
  });
});

describe("the tutorial's auto-win screens are exempt", () => {
  const autoWin = (overrides: Partial<Puzzle> = {}) =>
    puzzle({ init: "HI", winText: "HI", winMessage: ["IT IS .ON."], ...overrides });

  it("gives Decode no dialog at all, so the demo stays visible", () => {
    const { container } = render(
      <DecodePuzzle puzzle={autoWin()} bitButtonWidthPx={32} winActions={nextButton} />
    );

    expect(dialog(container)).to.equal(null);
    expect(winMessagePanel(container)?.textContent).to.contain("IT IS .ON.");
  });

  it("gives Encode no dialog either", () => {
    const { container } = render(
      <EncodePuzzle puzzle={autoWin({ type: "Encode" })} bitButtonWidthPx={32} winActions={nextButton} />
    );

    expect(dialog(container)).to.equal(null);
    expect(winMessagePanel(container)?.textContent).to.contain("IT IS .ON.");
  });

  it("still offers the way onward, in the open where it has always been", () => {
    const { container } = render(
      <DecodePuzzle puzzle={autoWin()} bitButtonWidthPx={32} winActions={nextButton} />
    );

    const found = nextButtons(container);
    expect(found).to.have.lengthOf(1);
    expect(found[0].closest("dialog")).to.equal(null);
  });
});
