import { Fragment } from "react";
import { Navigate, Route, useParams } from "react-router-dom";
import { MenuBrowser } from "./components/MenuBrowser.tsx";
import { CategoryBrowser } from "./components/CategoryBrowser.tsx";
import { LevelBrowser } from "./components/LevelBrowser.tsx";
import LevelPlay from "./components/LevelPlay.tsx";

/** A level root that opens its first puzzle instead of listing the level's puzzles. */
function RedirectLevelRootToPuzzle0({ menuName }: { menuName: string }) {
  const { categoryIndex, levelNumber } = useParams();
  return <Navigate to={`/${menuName}/${categoryIndex}/levels/${levelNumber}/puzzles/0`} replace={true} />;
}

/**
 * A menu area: the four routes that walk Menu → Category → Level → Puzzle.
 *
 * Every area has the same four, under its own path, so they are a table rather
 * than six near-identical blocks. Anything an area needs beyond these four
 * (chocolate's /letErRoll shortcut) stays written out in App's own Routes.
 */
interface MenuArea {
  /** Both the route prefix and the menuName the browsers are given. */
  menuName: string;
  /** Feature flag that unlocks the area. Omit for one that is always on. */
  feature?: string;
  /**
   * What `/:categoryIndex/levels/:levelNumber` renders. The tutorial jumps
   * straight to the first puzzle; everywhere else lists the level's puzzles.
   */
  levelRoot?: "browser" | "firstPuzzle";
  /** Force every puzzle in the area into Chocolate mode. */
  asChocolate?: boolean;
}

const MENU_AREAS: MenuArea[] = [
  { menuName: "tutorial", feature: "tutorial", levelRoot: "firstPuzzle" },
  { menuName: "vintage", feature: "vintage" },
  // The flag is deliberately not named after the /bigGame path.
  { menuName: "bigGame", feature: "bigGameRoutes" },
  // Ungated on purpose, as a test route.
  { menuName: "chocolate2" },
  // MENU_NAME_MAP aliases "chocolate" to the mall's API menu, so these routes
  // browse mall content while links stay under /chocolate.
  { menuName: "chocolate", feature: "chocolate", asChocolate: true },
  { menuName: "mall", feature: "mall" },
];

/*
 * A plain function, not a component: <Routes> reads its children looking for
 * <Route> elements and recurses into Fragments, so a fragment of Routes is
 * fine where a <MenuRoutes> component would be rejected.
 */
const menuAreaRoutes = ({ menuName, levelRoot = "browser", asChocolate = false }: MenuArea) => (
  <Fragment key={menuName}>
    <Route path={`/${menuName}`} element={<MenuBrowser menuName={menuName} />} />
    <Route path={`/${menuName}/:categoryIndex`} element={<CategoryBrowser menuName={menuName} />} />
    <Route
      path={`/${menuName}/:categoryIndex/levels/:levelNumber`}
      element={levelRoot === "firstPuzzle"
        ? <RedirectLevelRootToPuzzle0 menuName={menuName} />
        : <LevelBrowser menuName={menuName} />}
    />
    <Route
      path={`/${menuName}/:categoryIndex/levels/:levelNumber/puzzles/:puzzleIndex`}
      element={<LevelPlay menuName={menuName} asChocolate={asChocolate} />}
    />
  </Fragment>
);


/*
 * menuAreaRoutes deliberately is not a component — see its comment. Fast refresh
 * has nothing to preserve here either way, since the routes are rebuilt from the
 * table on every render of App.
 */
// eslint-disable-next-line react-refresh/only-export-components
export { MENU_AREAS, menuAreaRoutes };
export type { MenuArea };
