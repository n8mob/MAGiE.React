// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PlayPuzzle } from "../components/PlayPuzzle";
import { HeaderProvider } from "../components/HeaderContext";
import { fiveBitA1 } from "../encoding/FiveBitA1";
import { Puzzle } from "../model";

/*
 * Split play moves a puzzle's words off the mode and onto CH 1, which is a
 * rearrangement of three things that used to be adjacent: the clue above the
 * bits, the win transcript in a modal, and the after-win controls beneath it.
 *
 * What these cover is that each one moved rather than multiplied — the mode
 * must not keep drawing its own copy — and that the channel the player is not
 * watching stays *mounted*. Unmounting it would reset the puzzle every time
 * they looked at the clue, which is the failure this design is most exposed to.
 */

vi.mock("react-ga4", () => ({ default: { event: vi.fn(), send: vi.fn() } }));
vi.mock("../audio/SoundPlayer.ts", () => ({
  loadSound: vi.fn(() => Promise.resolve()),
  playSound: vi.fn(),
  primeAudio: vi.fn(),
}));

const puzzle = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  slug: "split-1",
  // Encode renders the *guess*, so the puzzle has to start with bits on screen.
  init: "AA",
  winText: "HI",
  clue: ["SWITCH THE BITS", "TO SPELL IT"],
  winMessage: ["NICELY DONE"],
  type: "Encode",
  encoding_name: "5bA1",
  encoding: fiveBitA1,
  ...overrides,
});

const renderSplit = (p: Puzzle = puzzle(), search = "?dualChannel") =>
  render(
    <MemoryRouter initialEntries={[`/tutorial/0/levels/0/puzzles/0${search}`]}>
      <HeaderProvider>
        <PlayPuzzle
          puzzle={p}
          puzzleShareString=""
          winActions={<button type="button">Next</button>}
        />
      </HeaderProvider>
    </MemoryRouter>
  );

const strip = () => document.querySelector(".channel-strip") as HTMLElement;
const signalPane = () => document.querySelector(".channel-pane-signal") as HTMLElement;
const adminPane = () => document.querySelector(".channel-pane-admin") as HTMLElement;
const isTunedTo = (channel: string) =>
  !!document.querySelector(`.dual-channel-play.tuned-${channel}`);

/** Set every bit of an Encode puzzle to the answer, one pointer tap at a time. */
const solve = (p: Puzzle) => {
  const answer = p.encoding.encodeText(p.winText).toPlainString();
  answer.split("").forEach((wanted, index) => {
    // Re-query each time: a toggle re-renders the grid.
    const bit = signalPane().querySelectorAll<HTMLInputElement>(".bit-checkbox")[index];
    if (bit.checked !== (wanted === "1")) {
      fireEvent.pointerDown(bit);
      fireEvent.pointerUp(bit);
    }
  });
};

// jsdom has no layout engine, so the scroll-into-view pass that follows every
// bit toggle has nothing to call. Same stubs encodeDecodeWinScreen.test uses.
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.scrollTo = vi.fn();

afterEach(cleanup);

describe("split play", () => {
  it("opens on the clue, with the bits only a strip away", () => {
    renderSplit();

    expect(isTunedTo("admin")).toBe(true);
    expect(within(adminPane()).getByText("SWITCH THE BITS")).toBeTruthy();
    expect(strip().textContent).toContain("CH 2");
  });

  it("leaves the clue off CH 2 — the mode draws only the machine", () => {
    renderSplit();
    fireEvent.click(strip());

    expect(isTunedTo("signal")).toBe(true);
    expect(signalPane().textContent).not.toContain("SWITCH THE BITS");
    expect(signalPane().querySelectorAll(".bit-checkbox").length).toBeGreaterThan(0);
  });

  it("keeps the puzzle mounted while the player reads the other channel", () => {
    const p = puzzle();
    renderSplit(p);

    fireEvent.click(strip());
    const bits = signalPane().querySelectorAll<HTMLInputElement>(".bit-checkbox");
    fireEvent.pointerDown(bits[1]);
    fireEvent.pointerUp(bits[1]);
    expect(signalPane().querySelectorAll<HTMLInputElement>(".bit-checkbox")[1].checked).toBe(true);

    // Up to CH 1 and back down again.
    fireEvent.click(strip());
    fireEvent.click(strip());

    expect(signalPane().querySelectorAll<HTMLInputElement>(".bit-checkbox")[1].checked).toBe(true);
  });

  it("answers a win on CH 1 instead of over the puzzle", () => {
    const p = puzzle();
    renderSplit(p);
    fireEvent.click(strip());
    solve(p);

    expect(isTunedTo("admin")).toBe(true);
    // The transcript, in the order it was spoken.
    const transcript = within(adminPane());
    expect(transcript.getByText("SWITCH THE BITS")).toBeTruthy();
    expect(transcript.getByText("HI")).toBeTruthy();
    expect(transcript.getByText("NICELY DONE")).toBeTruthy();
    expect(transcript.getByRole("button", { name: "Next" })).toBeTruthy();
    // No overlay, and no second copy of the win under the puzzle.
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector(".after-win-controls")).toBeNull();
  });

  it("sends the player back down to admire the puzzle", () => {
    const p = puzzle();
    renderSplit(p);
    fireEvent.click(strip());
    solve(p);

    fireEvent.click(strip());

    expect(isTunedTo("signal")).toBe(true);
    expect(signalPane().querySelectorAll(".bit-checkbox").length).toBeGreaterThan(0);
  });

  it("leaves ordinary play alone without the parameter", () => {
    const p = puzzle();
    render(
      <MemoryRouter>
        <HeaderProvider>
          <PlayPuzzle puzzle={p} puzzleShareString="" winActions={<button type="button">Next</button>} />
        </HeaderProvider>
      </MemoryRouter>
    );

    expect(document.querySelector(".dual-channel-play")).toBeNull();
    // The mode keeps its own clue, above its own bits.
    expect(document.querySelector("#clue-text")?.textContent).toContain("SWITCH THE BITS");
  });
});
