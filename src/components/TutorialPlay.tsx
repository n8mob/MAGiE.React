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
import { debug } from "../Logger.ts";

interface LevelPlayProps {
  menuName?: string;
}

export const LevelPlay: FC<LevelPlayProps> = ({ menuName }) => {
  const navigate = useNavigate();
  const { menu, loading, error } = useMenu(menuName);
  const { categoryIndex, levelNumber, puzzleIndex: puzzleIndexParam } = useParams();
  const { category } = useCategory(menu, categoryIndex);
  const { level } = useLevel(category, levelNumber);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const { setHeaderContent } = useHeader();
  const puzzle = useMemo(() => {
    return currentPuzzle?.encoding ? currentPuzzle : {
      ...currentPuzzle,
      encoding: menu?.encodingProviders[currentPuzzle?.encoding_name || ""]
    } as Puzzle;
  }, [currentPuzzle, menu?.encodingProviders]);

  const puzzleIndex = parseInt(puzzleIndexParam || "0", 10);
  const nextPuzzleIndex = puzzleIndex + 1;
  const isLastInLevel = !!level && nextPuzzleIndex >= level.puzzles.length;

  const linkAfterWin = { to: "", text: "" };
  if (isLastInLevel) {
    linkAfterWin.to = `/${menuName}/${categoryIndex}`;
    linkAfterWin.text = `Back to ${category?.name || "Category"}`;
  } else {
    linkAfterWin.to = `/${menuName}/${categoryIndex}/levels/${levelNumber}/puzzles/${nextPuzzleIndex}`;
    linkAfterWin.text = "Next ▶▶";
  }

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
    if (level) {
      setCurrentPuzzle(level.puzzles[puzzleIndex]);
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
    debug(`${puzzle.slug}: has won?: ${hasWon}`);

    return (
      <>
        <header>
          <h1 className="title">MAGiE</h1>
          <div className={'menu-title'}>
            {category && (
              <h3><Link to={`/${menuName}/${categoryIndex}`}>{category.name}</Link></h3>
            )}
            <h3 className="level-item">
              <Link to={`/${menuName}/${categoryIndex}/levels/${levelNumber}`}>{level.levelName.join(" ")}</Link></h3>
          </div>
        </header>
        <main>
          {puzzle && (
            <PlayPuzzle
              key={puzzle.slug}
              puzzle={puzzle}
              onWin={handleWin}
              puzzleShareString={shareString}
            />
          )}
          {hasWon && (
            <div className="after-win-controls">
              <button type={"button"}
                      onClick={() => {
                        ReactGA4.event('story_start_clicked', {
                          source: 'post-win-link',
                          puzzle_slug: puzzle?.slug,
                        });
                        navigate(linkAfterWin.to);
                      }}>{linkAfterWin.text}</button>
            </div>
          )}
        </main>
      </>
    );
  }
}
