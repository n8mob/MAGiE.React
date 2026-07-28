// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ReactNode } from "react";
import LevelPlay from "../components/LevelPlay";
import { HeaderProvider } from "../components/HeaderContext";
import { PageTitleProvider } from "../components/PageTitleContext";
import { usePageTracking } from "../hooks/usePageTracking";

/*
 * Issue #223 — the [Next ▶▶] button doesn't appear on auto-win tutorial levels.
 *
 * LevelPlay owns `hasWon`, but the win is detected down inside PlayPuzzle's
 * subtree. React flushes child effects before parent ones, so on an auto-win
 * puzzle (init === winText) the win arrives *before* LevelPlay's own state-reset
 * effect runs — and the reset then wipes it, leaving no button.
 *
 * A refresh appeared to cure it only because the menu fetch is async: the reset
 * effect had already run and settled by the time PlayPuzzle finally mounted.
 */

vi.mock("../audio/SoundPlayer.ts", () => ({
  loadSound: vi.fn(() => Promise.resolve()),
  playSound: vi.fn(),
}));
vi.mock("react-ga4", () => ({ default: { event: vi.fn(), send: vi.fn() } }));

/*
 * The menu is built once inside the factory and handed back by reference. The
 * real useMenu holds it in state, so it is likewise stable across renders —
 * returning a fresh Menu each call would spin LevelPlay's header effect forever.
 */
vi.mock("../hooks/useMenu.tsx", async () => {
  const { Menu } = await import("../model");
  const { fiveBitA1 } = await import("../encoding/FiveBitA1");

  const puzzle = (slug: string, init: string) => ({
    slug,
    init,
    winText: "HI",
    clue: [],
    winMessage: [],
    type: "Decode" as const,
    encoding_name: "5bA1",
    encoding: fiveBitA1,
  });

  const menu = new Menu({
    name: "Tutorial-June2025",
    updated_at: "2026-07-07T12:00:00Z",
    encodings: {},
    categories: {
      "How To Play": {
        name: "",
        levels: [{
          levelName: ["First Time"],
          levelNumber: 28,
          sort_order: null,
          // init === winText on the first two: already solved on arrival.
          puzzles: [puzzle("demo-0", "HI"), puzzle("demo-1", "HI"), puzzle("real-1", "")],
        }],
      },
    },
  });

  return { useMenu: () => ({ menu, loading: false, error: null }) };
});

/** Stands in for App, which is where usePageTracking actually lives. */
const TrackerHost = ({ children }: { children: ReactNode }) => {
  usePageTracking();
  return <>{children}</>;
};

const renderAt = (puzzleIndex: number) => render(
  <MemoryRouter initialEntries={[`/tutorial/0/levels/28/puzzles/${puzzleIndex}`]}>
    <PageTitleProvider>
      <HeaderProvider>
        <TrackerHost>
          <Routes>
            <Route
              path="/tutorial/:categoryIndex/levels/:levelNumber/puzzles/:puzzleIndex"
              element={<LevelPlay menuName="tutorial" />}
            />
          </Routes>
        </TrackerHost>
      </HeaderProvider>
    </PageTitleProvider>
  </MemoryRouter>
);

beforeEach(() => {
  sessionStorage.clear();
});

// Explicit: testing-library only auto-registers cleanup when Vitest runs with
// `globals: true`, which this project doesn't. Without it, renders pile up in
// document.body and queries match across tests.
afterEach(cleanup);

describe("LevelPlay auto-win (#223)", () => {
  it("shows the Next button on an auto-win puzzle", () => {
    renderAt(0);
    expect(screen.queryByRole("button", { name: /next/i })).to.not.equal(null);
  });

  it("shows it on a later auto-win puzzle in the same level", () => {
    renderAt(1);
    expect(screen.queryByRole("button", { name: /next/i })).to.not.equal(null);
  });

  it("does not show it on a puzzle that arrives unsolved", () => {
    renderAt(2);
    expect(screen.queryByRole("button", { name: /next/i })).to.equal(null);
  });
});

describe("LevelPlay page title", () => {
  it("titles the page with area, level name and position in level", () => {
    renderAt(0);
    expect(document.title).to.equal("MAGiE Tutorial: First Time 1/3");
  });

  it("counts puzzles from 1, matching what a player would say", () => {
    renderAt(1);
    expect(document.title).to.equal("MAGiE Tutorial: First Time 2/3");
  });
});
