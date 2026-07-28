import { Puzzle } from "../model.ts";
import { FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link, useParams } from "react-router-dom";
import { PlayPuzzle } from "./PlayPuzzle";
import { useMenu } from "../hooks/useMenu.tsx";
import { useCategory } from "../hooks/useCategory.tsx";
import { useHeader } from "../hooks/useHeader.ts";
import { useLevel } from "../hooks/useLevel.tsx";
import { StopwatchHandle } from "./Stopwatch.tsx";
import ReactGA4 from "react-ga4";
import { menuPlacement } from "../analytics/puzzleAnalytics.ts";
import { usePageTitle } from "../hooks/usePageTitle.ts";
import { useActivationGuard } from "../hooks/useActivationGuard.ts";
import { puzzleTitle } from "../pageTitles.ts";
import { debug } from "../Logger.ts";

interface LevelPlayProps {
  menuName?: string;
  /** Force every puzzle in this area to play in Chocolate mode. */
  asChocolate?: boolean;
}

const LevelPlay: FC<LevelPlayProps> = ({ menuName, asChocolate = false }) => {
  const navigate = useNavigate();
  const { menu, loading, error } = useMenu(menuName);
  const { categoryIndex, levelNumber, puzzleIndex: puzzleIndexParam } = useParams();
  const { category } = useCategory(menu, categoryIndex);
  const { level } = useLevel(category, levelNumber);
  const [hasWon, setHasWon] = useState(false);
  const { setHeaderContent } = useHeader();
  const puzzleIndex = parseInt(puzzleIndexParam || "0", 10);

  /*
   * Clear the win state during render rather than in an effect (#223).
   *
   * The win is detected inside PlayPuzzle's subtree, and React flushes child
   * effects before parent ones. An auto-win puzzle (init === winText) therefore
   * reports its win before an effect here would run, and the reset would then
   * wipe it — no [Next ▶▶] button. Resetting during render happens before the
   * children commit at all, so there is nothing to clobber.
   */
  const routeKey = `${menuName}/${categoryIndex}/${levelNumber}/${puzzleIndex}`;
  const [renderedRouteKey, setRenderedRouteKey] = useState(routeKey);
  if (routeKey !== renderedRouteKey) {
    setRenderedRouteKey(routeKey);
    setHasWon(false);
  }

  // The puzzle is derived from the route, not stored: navigating to a
  // puzzle that doesn't exist yields null instead of a stale puzzle.
  const currentPuzzle = useMemo<Puzzle | null>(() => {
    const rawPuzzle = level?.puzzles[puzzleIndex];
    if (!rawPuzzle) {
      return null;
    }
    if (rawPuzzle.encoding) {
      return rawPuzzle;
    }
    const encoding = menu?.encodingProviders[rawPuzzle.encoding_name || ""];
    if (!encoding) {
      console.error(`The "${menuName}" menu does not define the encoding "${rawPuzzle.encoding_name}" needed by puzzle "${rawPuzzle.slug}".`);
    }
    return { ...rawPuzzle, encoding } as Puzzle;
  }, [level, puzzleIndex, menu?.encodingProviders, menuName]);

  // Memoized rather than built inline at the call site: a fresh object every
  // render would churn PlayPuzzle's analytics context for no reason.
  const placement = useMemo(
    () => (menu && level && currentPuzzle)
      ? menuPlacement(menu, category, level, currentPuzzle, puzzleIndex)
      : undefined,
    [menu, category, level, currentPuzzle, puzzleIndex]
  );

  // null until the menu resolves, which holds the page_view rather than letting
  // it go out under the previous page's title.
  usePageTitle(
    level
      ? puzzleTitle(menuName, level.levelName.join(" "), puzzleIndex + 1, level.puzzles.length)
      : null
  );

  const nextPuzzleIndex = puzzleIndex + 1;
  const isLastInLevel = !!level && nextPuzzleIndex >= level.puzzles.length;

  const linkAfterWin = { to: "", text: "" };
  if (isLastInLevel) {
    if (menuName === "tutorial") {
      linkAfterWin.to = "/story";
      linkAfterWin.text = "READ THE STORY";
    } else {
      linkAfterWin.to = `/${menuName}/${categoryIndex}`;
      linkAfterWin.text = `Back to ${category?.name || "Category"}`;
    }
  } else {
    linkAfterWin.to = `/${menuName}/${categoryIndex}/levels/${levelNumber}/puzzles/${nextPuzzleIndex}`;
    linkAfterWin.text = "Next ▶▶";
  }

  // This button appears the instant the winning bit goes down, often right under
  // the finger that toggled it — so it must ignore that gesture's stray click.
  const afterWinControl = useActivationGuard(() => {
    ReactGA4.event('story_start_clicked', {
      source: 'post-win-link',
      puzzle_slug: currentPuzzle?.slug,
    });
    navigate(linkAfterWin.to);
  });

  useEffect(() => {
    if (!menu) {
      debug(`Waiting for the ${menuName} menu data.`);
      return;
    } else if (!category) {
      debug(`Cannot find category[${categoryIndex}] on the menu "${menuName}]".`);
      return;
    } else if (!levelNumber) {
      debug('Waiting for the level number.');
      return;
    }
    if (puzzleIndex === undefined || puzzleIndex === null) {
      debug("The puzzleNumber is missing. TODO: default to the first puzzle");
      return;
    } else if (!level) {
      debug(`Waiting for the level with number ${levelNumber})`);
      return;
    }

    // Set header content with category and level name
    if (category?.name && level) {
      setHeaderContent(
        <div className={'menu-title'}>
          <h3><Link to={`/${menuName}/${categoryIndex}`}>{category.name}</Link></h3>
          <h3 className="level-item">
            <Link to={`/${menuName}/${categoryIndex}/levels/${levelNumber}`}>{level.levelName.join(" ")}</Link></h3>
        </div>
      );
    }
    return () => setHeaderContent(null);
  }, [category, categoryIndex, level, levelNumber, menu, menuName, puzzleIndex, setHeaderContent]);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error loading menu!</div>;
  }

  function handleWin(stopwatch: StopwatchHandle) {
    debug(`LevelPlay.handleWin: ${stopwatch.displayTime()}`);
    setHasWon(true);
  }

  if (!menu || !currentPuzzle || !level) {
    return <><h2>Loading...</h2></>;
  } else {

    // Generate a share string for this puzzle context
    const shareString = `I solved the ${level.levelName.join(" ")} puzzle in the ${category?.name || ""} category!`;
    debug(`${currentPuzzle.slug}: has won?: ${hasWon}`);

    return (
      <>
        {currentPuzzle && (
          <PlayPuzzle
            key={currentPuzzle.slug}
            puzzle={currentPuzzle}
            onWin={handleWin}
            puzzleShareString={shareString}
            asChocolate={asChocolate}
            placement={placement}
          />
        )}
        {hasWon && (
          <div className="after-win-controls">
            <button type={"button"} {...afterWinControl}>{linkAfterWin.text}</button>
          </div>
        )}
      </>
    );
  }
}

export default LevelPlay;
