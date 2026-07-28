import { beforeEach, describe, expect, it, vi } from "vitest";
import { Menu, MenuData, Puzzle } from "../model";
import {
  dailyPlacement,
  menuPlacement,
  resolvePuzzleContext,
  trackPuzzleEnd,
  trackPuzzleStart,
} from "../analytics/puzzleAnalytics";
import ReactGA4 from "react-ga4";

vi.mock("react-ga4", () => ({ default: { event: vi.fn(), send: vi.fn() } }));

const sessionStore = new Map<string, string>();
vi.stubGlobal("sessionStorage", {
  getItem: (key: string) => sessionStore.get(key) ?? null,
  setItem: (key: string, value: string) => { sessionStore.set(key, value); },
  removeItem: (key: string) => { sessionStore.delete(key); },
  clear: () => sessionStore.clear(),
});

const puzzle = (slug: string, extra: Partial<Puzzle> = {}) => ({
  slug,
  init: "",
  clue: [],
  winText: "HI",
  winMessage: [],
  type: "Decode",
  encoding_name: "5bA1",
  ...extra,
} as Puzzle);

const level = (levelNumber: number, name: string[], slugs: string[]) => ({
  levelName: name,
  levelNumber,
  sort_order: null,
  puzzles: slugs.map(slug => puzzle(slug)),
});

const menuData = (overrides: Partial<MenuData> = {}): MenuData => ({
  name: "Tutorial-June2025",
  updated_at: "2026-07-07T23:30:00-06:00",
  encodings: {},
  categories: {
    "Decoding Letters": { name: "", levels: [
      level(28, ["First Time", "Alpha Length"], ["a1", "a2"]),
      level(29, ["Second Time"], ["b1"]),
    ] },
    "Encoding Letters": { name: "", levels: [
      level(30, ["Third Time"], ["c1"]),
    ] },
  },
  ...overrides,
});

const lastEvent = () => {
  const calls = vi.mocked(ReactGA4.event).mock.calls;
  return calls[calls.length - 1] as unknown as [string, Record<string, unknown>];
};

beforeEach(() => {
  sessionStore.clear();
  vi.mocked(ReactGA4.event).mockClear();
});

describe("Menu.menuPositions", () => {
  it("numbers every puzzle 1-based across the whole menu", () => {
    const menu = new Menu(menuData());
    expect(menu.menuPositions).to.deep.equal({ a1: 1, a2: 2, b1: 3, c1: 4 });
  });

  it("keeps the first position when a slug is repeated", () => {
    const data = menuData();
    data.categories["Encoding Letters"].levels[0].puzzles = [puzzle("a1"), puzzle("c1")];
    const menu = new Menu(data);
    // Menu is now a1, a2, b1, a1, c1 — the repeat keeps its original position...
    expect(menu.menuPositions.a1).to.equal(1);
    // ...but still consumes one, so c1 sits at 5 rather than shifting up to 4.
    expect(menu.menuPositions.c1).to.equal(5);
  });

  it("survives a level with no puzzles", () => {
    const data = menuData();
    data.categories["Decoding Letters"].levels.push({
      levelName: ["Empty"], levelNumber: 99, sort_order: null,
    } as never);
    expect(() => new Menu(data)).to.not.throw();
  });
});

describe("menuPlacement", () => {
  it("slugifies display names and uses the menu's own name, not the route", () => {
    const menu = new Menu(menuData());
    const placement = menuPlacement(
      menu,
      menu.categories["Decoding Letters"],
      menu.categories["Decoding Letters"].levels[0],
      puzzle("a2"),
      1,
    );

    expect(placement.menu).to.equal("tutorial-june2025");
    expect(placement.category).to.equal("decoding-letters");
    expect(placement.level).to.equal("first-time-alpha-length");
    expect(placement.puzzle_slug).to.equal("a2");
    expect(placement.menu_position).to.equal(2);
  });

  it("reports puzzle_number 1-based, matching menu_position", () => {
    const menu = new Menu(menuData());
    const first = menuPlacement(menu, null, null, puzzle("a1"), 0);
    expect(first.puzzle_number).to.equal(1);
  });

  it("truncates content_version without shifting the date across the UTC offset", () => {
    const menu = new Menu(menuData());
    // 23:30 at -06:00 is the following day in UTC. Round-tripping through
    // Date/toISOString() would report 2026-07-08.
    expect(menu.updated_at).to.contain("T23:30:00-06:00");
    expect(menuPlacement(menu, null, null, puzzle("a1"), 0).content_version)
      .to.equal("2026-07-07");
  });

  it("omits content_version when the menu has no updated_at", () => {
    const menu = new Menu(menuData({ updated_at: undefined }));
    expect(menuPlacement(menu, null, null, puzzle("a1"), 0).content_version).to.be.undefined;
  });
});

describe("dailyPlacement", () => {
  it("uses the daily sentinel and omits the menu-shaped params", () => {
    const placement = dailyPlacement(puzzle("daily-1"), new Date(2025, 3, 10));
    expect(placement.menu).to.equal("daily");
    expect(placement.puzzle_date).to.equal("2025-04-10");
    expect(placement.category).to.be.undefined;
    expect(placement.level).to.be.undefined;
    expect(placement.menu_position).to.be.undefined;
    expect(placement.content_version).to.be.undefined;
  });

  it("uses the local date, not the UTC date", () => {
    // Late local evening: toISOString() would roll to the 11th west of UTC.
    const placement = dailyPlacement(puzzle("daily-1"), new Date(2025, 3, 10, 23, 30));
    expect(placement.puzzle_date).to.equal("2025-04-10");
  });
});

describe("resolvePuzzleContext", () => {
  it("reports the type as played, not as authored", () => {
    const placement = dailyPlacement(puzzle("p"), new Date(2025, 3, 10));
    const authored = puzzle("p", { type: "Decode", encoding_name: "5bA1" });
    // What PlayPuzzle hands over after coercing into Chocolate mode.
    const asPlayed = puzzle("p", { type: "Chocolate", encoding_name: "5bA1" });

    expect(resolvePuzzleContext(placement, authored).puzzle_type).to.equal("decode");
    expect(resolvePuzzleContext(placement, asPlayed).puzzle_type).to.equal("chocolate");
  });

  it("slugifies the encoding name", () => {
    const placement = dailyPlacement(puzzle("p"), new Date(2025, 3, 10));
    expect(resolvePuzzleContext(placement, puzzle("p")).encoding).to.equal("5ba1");
  });
});

describe("attempt_number", () => {
  const context = () => resolvePuzzleContext(
    dailyPlacement(puzzle("p"), new Date(2025, 3, 10)),
    puzzle("p"),
  );

  it("starts at 1 and increments per start", () => {
    trackPuzzleStart(context());
    expect(lastEvent()[1].attempt_number).to.equal(1);

    trackPuzzleStart(context());
    expect(lastEvent()[1].attempt_number).to.equal(2);
  });

  it("carries the current attempt onto the matching end", () => {
    trackPuzzleStart(context());
    trackPuzzleEnd(context(), "lost");
    expect(lastEvent()[0]).to.equal("puzzle_end");
    expect(lastEvent()[1].attempt_number).to.equal(1);
    expect(lastEvent()[1].outcome).to.equal("lost");

    trackPuzzleStart(context());
    trackPuzzleEnd(context(), "won");
    expect(lastEvent()[1].attempt_number).to.equal(2);
    expect(lastEvent()[1].outcome).to.equal("won");
  });

  it("counts each puzzle separately", () => {
    trackPuzzleStart(context());
    trackPuzzleStart(context());
    trackPuzzleStart(resolvePuzzleContext(
      dailyPlacement(puzzle("other"), new Date(2025, 3, 11)),
      puzzle("other"),
    ));
    expect(lastEvent()[1].attempt_number).to.equal(1);
  });

  it("reports attempt 1 for an end with no recorded start", () => {
    trackPuzzleEnd(context(), "won");
    expect(lastEvent()[1].attempt_number).to.equal(1);
  });
});

describe("emitted params", () => {
  it("omits empty params rather than sending empty strings", () => {
    trackPuzzleStart(resolvePuzzleContext(
      dailyPlacement(puzzle("p"), new Date(2025, 3, 10)),
      puzzle("p"),
    ));
    const [name, params] = lastEvent();

    expect(name).to.equal("puzzle_start");
    expect(Object.keys(params)).to.not.include("category");
    expect(Object.keys(params)).to.not.include("level");
    expect(Object.keys(params)).to.not.include("content_version");
    expect(Object.values(params)).to.not.include("");
    expect(Object.values(params)).to.not.include(undefined);
  });

  it("sends solve_time_seconds only when one is supplied", () => {
    const context = resolvePuzzleContext(
      dailyPlacement(puzzle("p"), new Date(2025, 3, 10)),
      puzzle("p"),
    );

    trackPuzzleEnd(context, "won", 42);
    expect(lastEvent()[1].solve_time_seconds).to.equal(42);

    trackPuzzleEnd(context, "won");
    expect(Object.keys(lastEvent()[1])).to.not.include("solve_time_seconds");
  });

  it("keeps a zero-second solve rather than dropping it as empty", () => {
    const context = resolvePuzzleContext(
      dailyPlacement(puzzle("p"), new Date(2025, 3, 10)),
      puzzle("p"),
    );
    trackPuzzleEnd(context, "won", 0);
    expect(lastEvent()[1].solve_time_seconds).to.equal(0);
  });
});
