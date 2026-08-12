// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { ChocolateMode } from "../components/ChocolateMode";
import { WinScreen } from "../components/WinScreen";
import { fiveBitA1 } from "../encoding/FiveBitA1";
import { Puzzle } from "../model";

/*
 * The win screen (#227). An overlay, not a route: the puzzle stays mounted
 * behind it, which is what makes "admire puzzle" free and keeps the run's score
 * and bits from having to survive a navigation.
 *
 * jsdom implements <dialog> without showModal, so the component falls back to
 * the open attribute — no top layer and no focus trap here, but open and closed
 * are still observable, which is what these are about.
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
  winText: "A",
  winMessage: ["WELL DONE"],
  type: "Chocolate",
  clock: "scroll",
  encoding_name: "5bA1",
  encoding: fiveBitA1,
  ...overrides,
});

const renderChocolate = (p: Puzzle, winActions?: React.ReactNode) =>
  render(<ChocolateMode puzzle={p} bitButtonWidthPx={40} winActions={winActions} />);

const winScreen = (container: HTMLElement) =>
  container.querySelector<HTMLDialogElement>("dialog.win-screen");
const isShowing = (container: HTMLElement) => !!winScreen(container)?.hasAttribute("open");
const bitField = (container: HTMLElement) => container.querySelector(".bit-field");
const recall = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>(".win-screen-recall button");

const setReducedMotion = (matches: boolean) => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
};

const solve = (text: string) => {
  for (const bit of fiveBitA1.encodeText(text).toString()) {
    fireEvent.keyDown(window, { key: bit });
  }
};

/** Press a control the way a finger does, so the #233 activation guard arms. */
const press = (element: Element) => {
  fireEvent.pointerDown(element);
  fireEvent.click(element);
};

beforeEach(() => {
  setReducedMotion(true);
  // The player-paced clocks step the focused row into view, and jsdom has no
  // layout engine to do it with. Only Dessert avoids this, because there the
  // belt owns the view and the cursor never gets to move it.
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());
afterEach(cleanup);

describe("the win screen (#227)", () => {
  it("stays back until the rewind has finished", async () => {
    setReducedMotion(false);
    const { container } = renderChocolate(puzzle());
    solve("A");

    // The belt is still running itself back to the clue; covering that with a
    // dialog would throw the beat away.
    expect(isShowing(container)).to.equal(false);

    await waitFor(() => expect(isShowing(container)).to.equal(true));
  });

  it("arrives with the win in the player-paced clocks, which have no rewind", () => {
    const { container } = renderChocolate(puzzle({ clock: "none" }));
    solve("A");

    expect(isShowing(container)).to.equal(true);
  });

  it("locks every Taste bit once the puzzle is won", () => {
    const { container } = renderChocolate(puzzle({ clock: "none" }));
    solve("A");

    const bits = [...container.querySelectorAll<HTMLInputElement>(".bit-checkbox")];
    expect(bits).to.have.lengthOf(fiveBitA1.encodeText("A").length);
    expect(bits.every(bit => bit.disabled)).to.equal(true);
  });

  it("keeps a correct Dessert row editable until it crosses the judgment line", () => {
    const { container } = renderChocolate(puzzle({ winText: "AB" }));
    solve("A");

    const firstRow = container.querySelector(".bit-field p.letter-correct");
    const firstBit = firstRow?.querySelector<HTMLInputElement>(".bit-checkbox");
    expect(firstBit).to.not.equal(null);
    expect(firstBit?.disabled).to.equal(false);

    fireEvent.pointerDown(firstBit!, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(firstBit!, { pointerId: 1, clientX: 10, clientY: 10 });

    expect(firstRow?.classList.contains("letter-incorrect")).to.equal(true);
  });

  it("is not showing before the puzzle is solved", () => {
    const { container } = renderChocolate(puzzle());

    expect(isShowing(container)).to.equal(false);
  });

  it("shows the puzzle's win message", () => {
    const { container } = renderChocolate(puzzle({ clock: "none" }));
    solve("A");

    expect(winScreen(container)?.textContent).to.contain("WELL DONE");
  });

  it("carries whatever the route offers to do next", () => {
    const { container } = renderChocolate(
      puzzle({ clock: "none" }),
      <button type="button">Next</button>
    );
    solve("A");

    const actions = winScreen(container)?.querySelectorAll("button") ?? [];
    expect([...actions].map(button => button.textContent)).to.contain("Next");
  });

  it("reports the score for a scored run", () => {
    const { container } = renderChocolate(puzzle());
    solve("A");

    expect(winScreen(container)?.textContent).to.contain("SCORE");
  });

  it("leaves the solved puzzle on screen when dismissed", () => {
    const { container } = renderChocolate(puzzle({ clock: "none" }));
    solve("A");
    const dismiss = winScreen(container)?.querySelector(".win-screen-dismiss");

    press(dismiss!);

    // The whole point of an overlay: the puzzle was never unmounted, so there is
    // nothing to restore and nowhere to navigate back from.
    expect(isShowing(container)).to.equal(false);
    expect(bitField(container)).to.not.equal(null);
  });

  it("offers a way back once it has been dismissed", () => {
    const { container } = renderChocolate(puzzle({ clock: "none" }));
    solve("A");
    expect(recall(container)).to.equal(null);

    press(winScreen(container)!.querySelector(".win-screen-dismiss")!);

    // Everything that moves the player on lives on the screen, so admiring the
    // puzzle has to be a round trip rather than a one-way door.
    expect(recall(container)).to.not.equal(null);
    press(recall(container)!);
    expect(isShowing(container)).to.equal(true);
    expect(recall(container)).to.equal(null);
  });

  it("shows every letter in the clear when the run was won outright", () => {
    const { container } = renderChocolate(puzzle({ clock: "none" }));
    solve("A");

    const letters = [...container.querySelectorAll(".win-screen-answer span")];
    expect(letters.map(letter => letter.className)).to.deep.equal(["answer-correct"]);
  });

  it("shows the message as it was actually gleaned, wrong letters and all", async () => {
    /*
     * The belt has to be driven by hand. jsdom's animation clock does not share
     * a time origin with performance.now(), so a real frame arrives with a
     * timestamp behind the one the conveyor recorded when it started, and the
     * whole run elapses as zero. Feeding the clock explicitly is the only way to
     * make the conveyor move here at all.
     */
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    const { container } = renderChocolate(puzzle({
      winText: "HI",
      // Outrun on every letter, but never struck out — which in Dessert is still
      // a win. What was received is a message full of holes.
      scrollSpeed: 400,
      maxStrikes: 99,
    }));

    await act(async () => {
      frames[frames.length - 1](performance.now() + 1000);
    });

    expect(isShowing(container)).to.equal(true);
    const letters = [...container.querySelectorAll(".win-screen-answer span")];
    expect(letters).to.have.lengthOf(2);
    expect(letters.map(letter => letter.className))
      .to.deep.equal(["answer-incorrect", "answer-incorrect"]);
  });

  it("ignores a click that began somewhere else", () => {
    const { container } = renderChocolate(puzzle({ clock: "none" }));
    solve("A");
    const dismiss = winScreen(container)?.querySelector(".win-screen-dismiss");

    // The gesture that won the puzzle, finishing on a button that appeared
    // under the finger mid-press. Never armed here, so it is not ours (#233).
    fireEvent.click(dismiss!, { detail: 1 });

    expect(isShowing(container)).to.equal(true);
  });
});

describe("WinScreen on its own", () => {
  const screen = (won: boolean) => (
    <WinScreen won={won} clue={["A GREETING"]} answer="HI" winMessage={["WELL DONE"]} />
  );

  it("puts the screen back on offer when a new run starts", () => {
    const { container, rerender } = render(screen(true));
    press(container.querySelector(".win-screen-dismiss")!);
    expect(recall(container)).to.not.equal(null);

    // Chocolate's TRY AGAIN resets the run in place rather than remounting, so
    // a stale dismissal would otherwise follow the player into the next one.
    rerender(screen(false));
    rerender(screen(true));

    expect(isShowing(container)).to.equal(true);
    expect(recall(container)).to.equal(null);
  });

  it("reads as one transcript: what was asked, answered, and said back", () => {
    const { container } = render(screen(true));

    // Most win messages were written as the second half of a sentence the clue
    // begins, or as a reply to the answer. Order is the whole point.
    const lines = [...container.querySelectorAll(".win-screen-panel p")]
      .map(line => line.textContent);
    expect(lines).to.deep.equal(["A GREETING", "HI", "WELL DONE"]);
  });
});
