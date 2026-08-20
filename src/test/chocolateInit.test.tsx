// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { ChocolateMode } from "../components/ChocolateMode";
import { fiveBitA1 } from "../encoding/FiveBitA1";
import { Puzzle } from "../model";

/*
 * Chocolate seeds its bits from puzzle.init, same as Encode and Decode — see
 * useBitSounds' own doc comment, which already anticipated "a puzzle that
 * loads with bits already placed (chocolate mode)". The grid is one fixed row
 * per target character rather than a free-form guess, so init is applied
 * per-character rather than encoded wholesale.
 */

vi.mock("../audio/SoundPlayer.ts", () => ({
  loadSound: vi.fn(() => Promise.resolve()),
  playSound: vi.fn(),
}));
vi.mock("react-ga4", () => ({ default: { event: vi.fn(), send: vi.fn() } }));

const puzzle = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  slug: "dessert-1",
  init: "",
  clue: [],
  winText: "HI",
  winMessage: ["WELL DONE"],
  type: "Chocolate",
  clock: "none",
  encoding_name: "5bA1",
  encoding: fiveBitA1,
  ...overrides,
});

const renderChocolate = (p: Puzzle, winActions?: React.ReactNode) =>
  render(<ChocolateMode puzzle={p} bitButtonWidthPx={40} winActions={winActions} />);

const winScreen = (container: HTMLElement) =>
  container.querySelector<HTMLDialogElement>("dialog.win-screen");
const isShowing = (container: HTMLElement) => !!winScreen(container)?.hasAttribute("open");
const inlineWinMessage = (container: HTMLElement) => container.querySelector("#win-message");
// Runway and clue rows carry no bits, so restrict to the letter rows.
const rowBits = (container: HTMLElement, rowIndex: number) =>
  [...container.querySelectorAll<HTMLInputElement>(".bit-field p.letter-correct, .bit-field p.letter-incorrect")][rowIndex]
    ?.querySelectorAll<HTMLInputElement>(".bit-checkbox");

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
afterEach(() => vi.unstubAllGlobals());
afterEach(() => vi.clearAllMocks());

describe("chocolate init", () => {
  it("seeds the grid from a partial init, letter by letter", () => {
    const { container } = renderChocolate(puzzle({ init: "H" }));

    const wantBits = fiveBitA1.encodeText("H").toString();
    const gotBits = [...rowBits(container, 0) ?? []].map(b => b.checked ? "1" : "0").join("");
    expect(gotBits).to.equal(wantBits);

    const rows = [...container.querySelectorAll(".bit-field p")];
    expect(rows[0]?.className).to.contain("letter-correct");
    expect(rows[1]?.className).to.contain("letter-incorrect");
  });

  it("starts blank when init is empty, as before", () => {
    const { container } = renderChocolate(puzzle({ init: "" }));

    const allBits = [...container.querySelectorAll<HTMLInputElement>(".bit-checkbox")];
    expect(allBits.every(bit => !bit.checked)).to.equal(true);
  });

  it("arrives already won when init matches winText", () => {
    const { container } = renderChocolate(puzzle({ init: "HI" }));

    // Same reasoning as Encode/Decode's tutorial demo screens: a modal would
    // cover the bits the win message is pointing at, so it stays inline.
    expect(isShowing(container)).to.equal(false);
    expect(inlineWinMessage(container)?.textContent).to.contain("WELL DONE");
  });

  it("keeps every bit visible and disabled behind an inline auto-win", () => {
    const { container } = renderChocolate(puzzle({ init: "HI" }));

    const bits = [...container.querySelectorAll<HTMLInputElement>(".bit-checkbox")];
    expect(bits).to.have.lengthOf(fiveBitA1.encodeText("HI").length);
    expect(bits.every(bit => bit.disabled)).to.equal(true);
  });

  it("still offers whatever the route wants to do next, inline", () => {
    const { container } = renderChocolate(
      puzzle({ init: "HI" }),
      <button type="button">Next</button>
    );

    const controls = container.querySelector(".after-win-controls");
    expect(controls?.textContent).to.contain("Next");
  });

  it("keeps a real win on the modal WinScreen, not inline", () => {
    const { container } = renderChocolate(puzzle({ init: "", clock: "none" }));

    const solveBits = fiveBitA1.encodeText("HI").toString();
    for (const bit of solveBits) {
      fireEvent.keyDown(window, { key: bit });
    }

    expect(isShowing(container)).to.equal(true);
    expect(inlineWinMessage(container)).to.equal(null);
  });

  it("does not fire a bit sound for bits placed by init", async () => {
    const { playSound } = await import("../audio/SoundPlayer.ts");
    renderChocolate(puzzle({ init: "H" }));

    expect(playSound).not.toHaveBeenCalled();
  });

  it("resets TRY AGAIN to init rather than to blank", async () => {
    // jsdom's animation clock shares no time origin with performance.now(), so
    // the conveyor is driven by hand — same approach as chocolateWinScreen.
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    const { container } = renderChocolate(puzzle({
      init: "H",
      winText: "HIT",
      clock: "scroll",
      scrollSpeed: 400,
      maxStrikes: 1,
    }));

    // "I" and "T" are still blank, so one big frame jump crosses all three rows
    // and strikes out on the two wrong ones.
    await act(async () => {
      frames[frames.length - 1](performance.now() + 1000);
    });

    const retry = container.querySelector<HTMLButtonElement>(".chocolate-game-over button")!;
    fireEvent.pointerDown(retry);
    fireEvent.click(retry);

    const wantBits = fiveBitA1.encodeText("H").toString();
    const gotBits = [...rowBits(container, 0) ?? []].map(b => b.checked ? "1" : "0").join("");
    expect(gotBits).to.equal(wantBits);
  });
});
