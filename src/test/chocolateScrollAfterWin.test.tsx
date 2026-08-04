// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { ChocolateMode } from "../components/ChocolateMode";
import { fiveBitA1 } from "../encoding/FiveBitA1";
import { Puzzle } from "../model";

/*
 * Issue #227 — the player could not scroll the puzzle after a Dessert win.
 *
 * While the conveyor runs, the belt is a compositor transform inside an
 * overflow-hidden box. Unlocking overflow alone would not have been enough: the
 * runway and the clue are translated out of view, not scrolled out of it, so
 * there is nothing for the browser to scroll back to. The win hands the
 * transform over as an equal scrollTop instead.
 *
 * jsdom has no layout engine, so every measured pixel here is zero and the
 * arithmetic itself cannot be exercised — that is what the browser is for. What
 * is covered is the handover: who owns the view before and after the win, and
 * that the transform is actually surrendered rather than left fighting the
 * scroll position.
 */

vi.mock("../audio/SoundPlayer.ts", () => ({
  loadSound: vi.fn(() => Promise.resolve()),
  playSound: vi.fn(),
}));
vi.mock("react-ga4", () => ({ default: { event: vi.fn(), send: vi.fn() } }));

const dessert = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  slug: "dessert-1",
  init: "",
  clue: [],
  winText: "A",
  winMessage: [],
  type: "Chocolate",
  clock: "scroll",
  encoding_name: "5bA1",
  encoding: fiveBitA1,
  ...overrides,
});

const renderChocolate = (p: Puzzle) => render(<ChocolateMode puzzle={p} bitButtonWidthPx={40} />);

const display = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("#main-display")!;
const belt = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(".bit-field")!;
const judgmentLine = (container: HTMLElement) =>
  container.querySelector(".chocolate-judgment-line");
const beltDrivesView = (container: HTMLElement) =>
  display(container).classList.contains("conveyor-locked");
const runwayRows = (container: HTMLElement) =>
  [...container.querySelectorAll(".bit-field p.conveyor-spacer")];
const clueRows = (container: HTMLElement) =>
  [...container.querySelectorAll(".bit-field p.conveyor-clue")];
const gutterLetters = (container: HTMLElement) =>
  [...container.querySelectorAll(".bit-field p.letter-correct, .bit-field p.letter-incorrect")]
    .map(row => row.querySelector(".row-gutter")?.textContent ?? "");

/** Let the conveyor paint one frame, so it has actually written a transform. */
const nextFrame = () => act(() => new Promise<void>(resolve => {
  requestAnimationFrame(() => resolve());
}));

/** Type the winning bits. Derived from the encoder so the test can't drift. */
const solve = (text: string) => {
  for (const bit of fiveBitA1.encodeText(text).toString()) {
    fireEvent.keyDown(window, { key: bit });
  }
};

/** jsdom has no matchMedia worth the name, so state the preference outright. */
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

/*
 * Most of these are about the handover, not the flourish in front of it, so they
 * run with reduced motion: the rewind is skipped and the view changes hands
 * synchronously. The rewind itself gets its own describe at the bottom.
 */
beforeEach(() => setReducedMotion(true));
afterEach(() => vi.unstubAllGlobals());
afterEach(cleanup);

describe("Dessert scrolling after the win (#227)", () => {
  it("lets the belt own the view while the run is live", () => {
    const { container } = renderChocolate(dessert());

    expect(beltDrivesView(container)).to.equal(true);
  });

  it("hands the view to the player once the run is won", () => {
    const { container } = renderChocolate(dessert());
    solve("A");

    expect(beltDrivesView(container)).to.equal(false);
  });

  it("surrenders the belt transform rather than leaving it fighting the scroll", async () => {
    const { container } = renderChocolate(dessert());
    await nextFrame();

    // The conveyor drives with a transform, so there is one to give up.
    expect(belt(container).style.transform).to.contain("translate3d");

    solve("A");

    expect(belt(container).style.transform).to.equal("");
  });

  it("takes the judgment line off the lens when there is nothing left to judge", () => {
    const { container } = renderChocolate(dessert());
    expect(judgmentLine(container)).to.not.equal(null);

    solve("A");

    expect(judgmentLine(container)).to.equal(null);
  });

  it("gives the first letter a runway to ride up from while the belt moves", () => {
    const { container } = renderChocolate(dessert());

    expect(runwayRows(container).length).to.be.greaterThan(0);
  });

  it("clears the runway away once the belt stops", () => {
    const { container } = renderChocolate(dessert());
    solve("A");

    // Scaffolding while the belt moves, unexplained blank above the clue after.
    expect(runwayRows(container)).to.have.lengthOf(0);
  });

  it("keeps the clue and the target letters aligned once the runway goes", () => {
    const { container } = renderChocolate(dessert({ clue: ["READ IT"], winText: "CAB" }));
    solve("CAB");

    // The off-by-N this guards: every rendered row index is mapped through
    // beltOffset, which the vanishing runway shifts.
    const clues = clueRows(container);
    expect(clues).to.have.lengthOf(1);
    expect(clues[0].textContent).to.contain("READ IT");
    expect(gutterLetters(container).join("")).to.equal("CAB");
  });

  it("never takes the view away in the player-paced clocks", () => {
    const { container } = renderChocolate(dessert({ clock: "none" }));

    expect(beltDrivesView(container)).to.equal(false);
    expect(judgmentLine(container)).to.equal(null);
  });
});

/*
 * The conveyor loop is a passive effect, so React cancels it asynchronously,
 * after the layout effect that hands the view over has already run. That leaves
 * a window: a frame queued before the win can fire after the handover and write
 * the transform back.
 *
 * Nothing clears it a second time, so the belt ends up displaced twice — once by
 * the resurrected transform and once by the scrollTop it was traded for. The
 * clue strands above the top of the scroll range and a screenful of blank opens
 * below the message. It gets worse the further the belt ran, which is why long
 * puzzles show it and short ones don't.
 *
 * Driving frames by hand is the only way to land in that window deliberately;
 * real timing decides it in the browser.
 */
describe("a frame arriving after the handover (#227)", () => {
  let frames: FrameRequestCallback[] = [];

  const queueFrames = () => {
    frames = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    // A no-op cancel is the point: it models the callback that was already
    // handed to the browser and is going to run whatever React does next.
    vi.stubGlobal("cancelAnimationFrame", () => {});
  };

  const runFrame = (callback: FrameRequestCallback) => act(() => {
    callback(performance.now());
  });

  it("does not let a stale frame put the transform back", async () => {
    queueFrames();
    const { container } = renderChocolate(dessert());

    // One good frame, so the belt is genuinely driving.
    await runFrame(frames[frames.length - 1]);
    expect(belt(container).style.transform).to.contain("translate3d");

    // The frame the conveyor queued for itself, still pending when the win lands.
    const stale = frames[frames.length - 1];
    solve("A");
    expect(belt(container).style.transform).to.equal("");

    await runFrame(stale);

    expect(belt(container).style.transform).to.equal("");
  });
});

describe("the rewind back to the clue (#227)", () => {
  it("keeps the belt until the rewind is done, then hands over", async () => {
    setReducedMotion(false);
    const { container } = renderChocolate(dessert({ clue: ["READ IT"], winText: "CAB" }));
    await nextFrame();
    solve("CAB");

    // The run is over but the belt is not: it still has the rewind to perform,
    // and it stays locked and transform-driven for the length of it.
    expect(beltDrivesView(container)).to.equal(true);
    expect(belt(container).style.transform).to.contain("translate3d");
    expect(judgmentLine(container)).to.equal(null);

    await waitFor(() => expect(beltDrivesView(container)).to.equal(false));

    // Parked at the clue, and the scaffolding it was riding on is gone.
    expect(belt(container).style.transform).to.equal("");
    expect(runwayRows(container)).to.have.lengthOf(0);
    expect(clueRows(container)).to.have.lengthOf(1);
    expect(gutterLetters(container).join("")).to.equal("CAB");
  });

  it("goes straight there for a player who asked for less motion", () => {
    setReducedMotion(false);
    const { container } = renderChocolate(dessert());
    setReducedMotion(true);
    solve("A");

    expect(beltDrivesView(container)).to.equal(false);
  });
});
