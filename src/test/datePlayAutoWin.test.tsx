// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DatePlay } from "../components/DatePlay";
import { HeaderProvider } from "../components/HeaderContext";
import { getDailyPuzzleForDate } from "../PuzzleApi";
import { PuzzleForDate } from "../model";

/*
 * The DatePlay half of #223.
 *
 * DatePlay never actually reproduced the missing-button bug, because its async
 * fetch nulls currentPuzzle and unmounts PlayPuzzle — so the remount always
 * lands after the state reset rather than before it. That is timing, though,
 * not design: serving a cached puzzle synchronously would be enough to break
 * it. These tests pin the behaviour down so the render-time reset can't drift.
 */

vi.mock("../audio/SoundPlayer.ts", () => ({
  loadSound: vi.fn(() => Promise.resolve()),
  playSound: vi.fn(),
}));
vi.mock("react-ga4", () => ({ default: { event: vi.fn(), send: vi.fn() } }));
vi.mock("../PuzzleApi", () => ({ getDailyPuzzleForDate: vi.fn() }));

const dailyPuzzle = (init: string): PuzzleForDate => ({
  date: "2025-04-10",
  puzzle: {
    slug: "daily-2025-04-10",
    init,
    winText: "HI",
    clue: [],
    winMessage: ["Nice"],
    type: "Decode",
    encoding_name: "5bA1",
    // No `encoding` here on purpose: the API returns raw puzzle data and
    // fetchPuzzle builds the encoder from the sibling `encoding` block below.
  } as unknown as PuzzleForDate["puzzle"],
  encoding: {
    type: "fixed",
    encoding: { width: 5, encodingMap: { " ": 0, "H": 8, "I": 9 } },
  },
});

const renderDate = () => render(
  <MemoryRouter initialEntries={["/date/2025/04/10"]}>
    <HeaderProvider>
      <Routes>
        <Route path="/date/:year/:month/:day" element={<DatePlay />} />
      </Routes>
    </HeaderProvider>
  </MemoryRouter>
);

afterEach(cleanup);

describe("DatePlay auto-win", () => {
  it("shows the share controls on a daily puzzle that arrives solved", async () => {
    vi.mocked(getDailyPuzzleForDate).mockResolvedValue(dailyPuzzle("HI"));
    renderDate();

    expect(await screen.findByRole("button", { name: /share your win/i })).to.not.equal(null);
  });

  it("does not show them on a daily puzzle that arrives unsolved", async () => {
    vi.mocked(getDailyPuzzleForDate).mockResolvedValue(dailyPuzzle(""));
    renderDate();

    // Wait for the puzzle to actually land, so the absence below means
    // "not won" rather than "not loaded yet".
    await waitForElementToBeRemoved(() => screen.queryByText(/rewinding the tape/i));
    expect(screen.queryByRole("button", { name: /share your win/i })).to.equal(null);
  });
});
