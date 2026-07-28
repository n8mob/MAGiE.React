// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReactGA4 from "react-ga4";
import { PlayPuzzle } from "../components/PlayPuzzle";
import { HeaderProvider } from "../components/HeaderContext";
import { fiveBitA1 } from "../encoding/FiveBitA1";
import { Puzzle } from "../model";
import { PuzzlePlacement } from "../analytics/puzzleAnalytics";

/*
 * The pairing of puzzle_start and puzzle_end is what the whole spec rests on:
 * abandonment is "a start with no end" and time-on-puzzle is the delta between
 * them. Both readings break if the two ever arrive out of order.
 *
 * They nearly did. An auto-win puzzle (init === winText) is already solved when
 * it mounts, and the judgment that notices lives in DecodePuzzle — a *child* of
 * PlayPuzzle. React flushes child effects before parent ones, so the win reached
 * PlayPuzzle before PlayPuzzle's own mount effect had opened the attempt.
 *
 * These tests run against React's real commit-phase ordering, so they'd catch a
 * regression from a refactor here or from a change in React itself.
 */

vi.mock("react-ga4", () => ({ default: { event: vi.fn() } }));
vi.mock("../audio/SoundPlayer.ts", () => ({
  loadSound: vi.fn(() => Promise.resolve()),
  playSound: vi.fn(),
}));

const placement: PuzzlePlacement = {
  menu: "tutorial-june2025",
  category: "decoding-letters",
  level: "first-time",
  puzzle_slug: "demo-1",
  puzzle_number: 1,
  menu_position: 1,
  content_version: "2026-07-07",
};

const puzzle = (overrides: Partial<Puzzle> = {}): Puzzle => ({
  slug: "demo-1",
  init: "HI",
  winText: "HI", // init === winText, so this puzzle opens already solved
  clue: [],
  winMessage: [],
  type: "Decode",
  encoding_name: "5bA1",
  encoding: fiveBitA1,
  ...overrides,
});

const renderPuzzle = (p: Puzzle, strict = false) => {
  const tree = (
    <MemoryRouter>
      <HeaderProvider>
        <PlayPuzzle puzzle={p} puzzleShareString="" placement={placement} />
      </HeaderProvider>
    </MemoryRouter>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
};

const eventNames = () => vi.mocked(ReactGA4.event).mock.calls.map(call => call[0]);
const eventsNamed = (name: string) =>
  vi.mocked(ReactGA4.event).mock.calls
    .filter(call => call[0] === name)
    .map(call => call[1] as unknown as Record<string, unknown>);

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(ReactGA4.event).mockClear();
});

// Explicit: testing-library only auto-registers cleanup when Vitest runs with
// `globals: true`, which this project doesn't. Without it, each test leaves a
// live tree (and a ticking Stopwatch) mounted behind it.
afterEach(cleanup);

describe("PlayPuzzle funnel events", () => {
  it("emits puzzle_start before puzzle_end on an auto-win puzzle", () => {
    renderPuzzle(puzzle());
    const names = eventNames();

    expect(names).to.contain("puzzle_start");
    expect(names).to.contain("puzzle_end");
    expect(names.indexOf("puzzle_start")).to.be.lessThan(names.indexOf("puzzle_end"));
  });

  it("emits exactly one start and one end for an auto-win puzzle", () => {
    renderPuzzle(puzzle());

    expect(eventsNamed("puzzle_start")).to.have.lengthOf(1);
    expect(eventsNamed("puzzle_end")).to.have.lengthOf(1);
  });

  it("agrees on attempt_number across the pair", () => {
    renderPuzzle(puzzle());

    expect(eventsNamed("puzzle_start")[0].attempt_number).to.equal(1);
    expect(eventsNamed("puzzle_end")[0].attempt_number).to.equal(1);
  });

  it("keeps the pair aligned when the same puzzle is replayed in one session", () => {
    renderPuzzle(puzzle()).unmount();
    vi.mocked(ReactGA4.event).mockClear();
    renderPuzzle(puzzle());

    // The bug reported the end as attempt 1 (read before the start had written)
    // while the start that followed it wrote 2.
    expect(eventsNamed("puzzle_start")[0].attempt_number).to.equal(2);
    expect(eventsNamed("puzzle_end")[0].attempt_number).to.equal(2);
  });

  it("reports the win outcome and the placement block", () => {
    renderPuzzle(puzzle());
    const end = eventsNamed("puzzle_end")[0];

    expect(end.outcome).to.equal("won");
    expect(end.menu).to.equal("tutorial-june2025");
    expect(end.puzzle_slug).to.equal("demo-1");
    expect(end.puzzle_type).to.equal("decode");
    expect(end.encoding).to.equal("5ba1");
  });

  it("counts StrictMode's double-invoke as one attempt", () => {
    renderPuzzle(puzzle(), true);

    expect(eventsNamed("puzzle_start")).to.have.lengthOf(1);
    expect(eventsNamed("puzzle_end")).to.have.lengthOf(1);
  });

  it("starts but does not end a puzzle that arrives unsolved", () => {
    renderPuzzle(puzzle({ init: "", winText: "HI" }));

    expect(eventsNamed("puzzle_start")).to.have.lengthOf(1);
    // Abandonment is inferred from exactly this shape: a start with no end.
    expect(eventsNamed("puzzle_end")).to.have.lengthOf(0);
  });
});
