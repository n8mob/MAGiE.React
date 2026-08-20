import { Puzzle } from "../model.ts";
import { FC, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { isTutorialContent } from "../tutorialContent.ts";
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
  const { setHeaderContent } = useHeader();
  const puzzleIndex = parseInt(puzzleIndexParam || "0", 10);

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
    () => (
      menu && level && currentPuzzle
    )
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
  const isTutorialLevel = !!level && isTutorialContent(menuName, category?.name, level.levelName.join(" "), currentPuzzle?.slug);
  // Finishing a tutorial level is a fork, not a dead end: offer more tutorial
  // content alongside the way out, rather than only the way out.
  const showTutorialChoice = isLastInLevel && isTutorialLevel;

  const primaryLink = { to: "", text: "" };
  if (isLastInLevel) {
    if (isTutorialLevel) {
      primaryLink.to = "/today";
      primaryLink.text = "▶▶ Fast-Forward to Today's puzzle";
    } else {
      primaryLink.to = `/${menuName}/${categoryIndex}`;
      primaryLink.text = `Back to ${category?.name || "Category"}`;
    }
  } else {
    primaryLink.to = `/${menuName}/${categoryIndex}/levels/${levelNumber}/puzzles/${nextPuzzleIndex}`;
    primaryLink.text = "Next ▶▶";
  }

  // Only offered alongside primaryLink, when showTutorialChoice is true.
  const moreTutorialsLink = { to: "/tutorial", text: "▶ More Tutorials" };

  const afterWinEvent = (source: string) =>
    ReactGA4.event('story_start_clicked', { source, puzzle_slug: currentPuzzle?.slug });

  // These buttons appear the instant the winning bit goes down, often right
  // under the finger that toggled it — so they must ignore that gesture's stray
  // click.
  const afterWinControl = useActivationGuard(() => {
    afterWinEvent('post-win-link');
    navigate(primaryLink.to);
  });

  const moreTutorialsControl = useActivationGuard(() => {
    afterWinEvent('post-win-link-deeper-tutorials');
    navigate(moreTutorialsLink.to);
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
          <h3 className="menu-title-row">
            <Link
              className="symbol-button puzzle-symbol-button"
              to={`/${menuName}/${categoryIndex}`}
              aria-label={`Back to ${category.name}`}
            >⏏</Link>
            <span>{level.levelName.join(" ")}</span>
            <span className="menu-title-balance" aria-hidden="true" />
          </h3>
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
  }

  if (!menu || !currentPuzzle || !level) {
    return <><h2>Loading...</h2></>;
  } else {

    // Generate a share string for this puzzle context
    const shareString = `I solved the ${level.levelName.join(" ")} puzzle in the ${category?.name || ""} category!`;

    return (
      <>
        {currentPuzzle && (
          <PlayPuzzle
            key={currentPuzzle.slug}
            puzzle={currentPuzzle}
            onWin={handleWin}
            puzzleShareString={shareString}
            winActions={
              showTutorialChoice ? (
                <>
                  <button type={"button"} {...moreTutorialsControl}>{moreTutorialsLink.text}</button>
                  <button type={"button"} {...afterWinControl}>{primaryLink.text}</button>
                </>
              ) : (
                <button type={"button"} {...afterWinControl}>{primaryLink.text}</button>
              )
            }
            winInline={isTutorialContent(
              menuName,
              menu?.name,
              category?.name,
              level?.levelName?.join(" "),
              currentPuzzle?.slug,
            )}
            asChocolate={asChocolate}
            placement={placement}
          />
        )}
      </>
    );
  }
}

export default LevelPlay;
