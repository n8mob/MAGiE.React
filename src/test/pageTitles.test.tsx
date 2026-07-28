// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReactGA4 from "react-ga4";
import { PageTitleProvider } from "../components/PageTitleContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { usePageTracking } from "../hooks/usePageTracking";
import {
  areaTitle,
  categoryTitle,
  dailyPuzzleTitle,
  notFoundTitle,
  puzzleTitle,
  storyTitle,
} from "../pageTitles";

vi.mock("react-ga4", () => ({ default: { send: vi.fn(), event: vi.fn() } }));

/*
 * usePageTracking lives in App and fires on location change; the titles that
 * matter come from menu data that arrives asynchronously. This harness mirrors
 * that exactly — tracker in the parent, title in the child — because the whole
 * design rests on a child's layout effect beating the parent's passive one.
 */
const Route = ({ title }: { title: string | null }) => {
  usePageTitle(title);
  return <div>route</div>;
};

const App = ({ title, claims = true }: { title: string | null; claims?: boolean }) => {
  usePageTracking();
  return claims ? <Route title={title} /> : <div>untitled route</div>;
};

const renderApp = (title: string | null, claims = true) => render(
  <MemoryRouter initialEntries={["/tutorial/0/levels/28/puzzles/0"]}>
    <PageTitleProvider>
      <App title={title} claims={claims} />
    </PageTitleProvider>
  </MemoryRouter>
);

const pageViews = () => vi.mocked(ReactGA4.send).mock.calls.map(
  call => call[0] as unknown as { hitType: string; page: string; title: string }
);

beforeEach(() => {
  vi.mocked(ReactGA4.send).mockClear();
  document.title = "";
});
afterEach(cleanup);

describe("page title builders", () => {
  it("formats a daily puzzle from the local date", () => {
    expect(dailyPuzzleTitle(new Date(2026, 6, 27))).to.equal("MAGiE 2026-07-27");
  });

  it("does not shift the date across the UTC offset", () => {
    expect(dailyPuzzleTitle(new Date(2026, 6, 27, 23, 30))).to.equal("MAGiE 2026-07-27");
  });

  it("includes the area so same-named levels in different menus stay distinct", () => {
    expect(puzzleTitle("tutorial", "First Time", 1, 3)).to.equal("MAGiE Tutorial: First Time 1/3");
    expect(puzzleTitle("mall", "First Time", 1, 3)).to.equal("MAGiE Mall: First Time 1/3");
  });

  it("uses display names, not route segments", () => {
    expect(areaTitle("bigGame")).to.equal("MAGiE Big Game");
    expect(categoryTitle("tutorial", "Decoding Letters")).to.equal("MAGiE Tutorial: Decoding Letters");
  });

  it("falls back to the route segment for an unmapped menu", () => {
    expect(areaTitle("somethingNew")).to.equal("MAGiE somethingNew");
  });

  it("titles the story index and a chapter differently", () => {
    expect(storyTitle()).to.equal("MAGiE Story");
    expect(storyTitle("The Signal")).to.equal("MAGiE Story: The Signal");
    expect(notFoundTitle()).to.equal("MAGiE: Page Not Found");
  });
});

describe("page_view timing", () => {
  it("holds the page_view while the route's title is still loading", () => {
    renderApp(null);
    expect(pageViews()).to.have.lengthOf(0);
  });

  it("sends it with the real title once the data arrives", () => {
    const view = renderApp(null);
    expect(pageViews()).to.have.lengthOf(0);

    view.rerender(
      <MemoryRouter initialEntries={["/tutorial/0/levels/28/puzzles/0"]}>
        <PageTitleProvider>
          <App title="MAGiE Tutorial: First Time 1/3" />
        </PageTitleProvider>
      </MemoryRouter>
    );

    expect(pageViews()).to.have.lengthOf(1);
    expect(pageViews()[0].title).to.equal("MAGiE Tutorial: First Time 1/3");
    expect(pageViews()[0].page).to.equal("/tutorial/0/levels/28/puzzles/0");
  });

  it("sends the title on the very first page_view when it is known up front", () => {
    renderApp("MAGiE 2026-07-27");

    expect(pageViews()).to.have.lengthOf(1);
    expect(pageViews()[0].title).to.equal("MAGiE 2026-07-27");
  });

  it("does not drop the page_view for a route that declares no title", () => {
    renderApp(null, false);

    expect(pageViews()).to.have.lengthOf(1);
    expect(pageViews()[0].title).to.equal("MAGiE");
  });

  it("sends only once per path, however often the title re-settles", () => {
    const tree = (title: string) => (
      <MemoryRouter initialEntries={["/tutorial/0/levels/28/puzzles/0"]}>
        <PageTitleProvider>
          <App title={title} />
        </PageTitleProvider>
      </MemoryRouter>
    );
    const view = render(tree("MAGiE Tutorial: First Time 1/3"));
    view.rerender(tree("MAGiE Tutorial: First Time 1/3"));
    view.rerender(tree("MAGiE Tutorial: Renamed 1/3"));

    expect(pageViews()).to.have.lengthOf(1);
  });

  it("updates document.title too, not just the analytics param", () => {
    renderApp("MAGiE 2026-07-27");
    expect(document.title).to.equal("MAGiE 2026-07-27");
  });
});
