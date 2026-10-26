// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { Children, ReactElement } from "react";
import { MENU_AREAS, menuAreaRoutes, MenuArea } from "../menuAreas";

/*
 * The six menu areas used to be six hand-written blocks of four <Route>s. They
 * are a table now, which trades the duplication for a single template every
 * area depends on — so what these cover is that the template still produces the
 * four paths each area was getting before, and that the two areas which are
 * *not* uniform (the tutorial's level root, chocolate's forced mode) keep the
 * thing that makes them different.
 */

/** What a menu-area route renders: one of the browsers, or LevelPlay. */
type AreaElement = ReactElement<{ menuName: string; asChocolate?: boolean }>;

const routeProps = (area: MenuArea) =>
  Children.toArray(menuAreaRoutes(area).props.children)
    .map(child => (child as ReactElement<{ path: string; element: AreaElement }>).props);

const pathsFor = (area: MenuArea) => routeProps(area).map(route => route.path);

const area = (menuName: string) => {
  const found = MENU_AREAS.find(candidate => candidate.menuName === menuName);
  if (!found) {
    throw new Error(`no menu area named ${menuName}`);
  }
  return found;
};

describe("menu areas", () => {
  it("gives every area the same four routes under its own path", () => {
    for (const menuArea of MENU_AREAS) {
      expect(pathsFor(menuArea)).toEqual([
        `/${menuArea.menuName}`,
        `/${menuArea.menuName}/:categoryIndex`,
        `/${menuArea.menuName}/:categoryIndex/levels/:levelNumber`,
        `/${menuArea.menuName}/:categoryIndex/levels/:levelNumber/puzzles/:puzzleIndex`,
      ]);
    }
  });

  it("still routes all six areas", () => {
    expect(MENU_AREAS.map(menuArea => menuArea.menuName)).toEqual(
      ["tutorial", "vintage", "bigGame", "chocolate2", "chocolate", "mall"]
    );
  });

  it("keeps the flag names that do not match their path", () => {
    expect(area("bigGame").feature).toBe("bigGameRoutes");
    // Ungated on purpose, as a test route.
    expect(area("chocolate2").feature).toBeUndefined();
  });

  it("sends a tutorial level root to its first puzzle, not to a level browser", () => {
    const levelRoot = routeProps(area("tutorial"))[2].element;
    // The redirect is built from the area's own name — it used to hardcode
    // /tutorial, which would have sent every other area to the wrong place.
    expect(levelRoot.props.menuName).toBe("tutorial");
    expect(levelRoot.props.asChocolate).toBeUndefined();
  });

  it("lists the puzzles at every other area's level root", () => {
    for (const menuArea of MENU_AREAS.filter(a => a.menuName !== "tutorial")) {
      expect(routeProps(menuArea)[2].element.props).toEqual({ menuName: menuArea.menuName });
    }
  });

  it("forces Chocolate mode in the chocolate area and nowhere else", () => {
    for (const menuArea of MENU_AREAS) {
      const puzzle = routeProps(menuArea)[3].element;
      expect(puzzle.props.asChocolate).toBe(menuArea.menuName === "chocolate");
    }
  });
});
