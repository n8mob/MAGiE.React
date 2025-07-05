import { Puzzle } from "../Menu.ts";
import { FC, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PlayPuzzle } from "./PlayPuzzle";
import { useMenu } from "../hooks/useMenu.tsx";
import { useCategory } from "../hooks/useCategory.tsx";
import { useHeader } from "../hooks/useHeader.ts";
import { useLevel } from "../hooks/useLevel.tsx";

interface LevelPlayProps {
  menuName?: string;
}

const LevelPlay: FC<LevelPlayProps> = ({menuName}) => {
  const {menu, loading, error} = useMenu(menuName);
  const {categoryIndex, levelNumber, puzzleIndex} = useParams();
  const {category} = useCategory(menu, categoryIndex);
  const { level } = useLevel(category, levelNumber);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const {setHeaderContent} = useHeader();

  useEffect(() => {
    if (!menu) {
      console.warn('Waiting for the menu.');
      return;
    }

    if (!category) {
      console.warn(`Cannot find category[${categoryIndex}] on the menu "${menuName}]".`);
      return;
    }

    if (!levelNumber) {
      console.warn('Waiting for the level number.');
      return;
    }

    if (!puzzleIndex) {
      console.warn("The puzzleNumber is missing. We'll use the first puzzle.");
    }

    if (!level) {
      console.warn(`Waiting for the level with number ${levelNumber})`);
      return;
    }

    // Set header content with category and level name
    if (category?.name && level) {
      setHeaderContent(
        <div className={'menu-title'}>
          <h3><Link to={`/${menuName}/${categoryIndex}`}>{category.name}</Link></h3>
          <h3 className="level-item"><Link to={`/${menuName}/${categoryIndex}/levels/${levelNumber}`}>{level.levelName.join(" ")}</Link></h3>
        </div>
      );
      setCurrentPuzzle(level.puzzles[parseInt(puzzleIndex || '0', 10)]);
    }
    return () => setHeaderContent(null);
  }, [category, categoryIndex, level, levelNumber, menu, menuName, puzzleIndex, setHeaderContent]);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error loading menu!</div>;
  }

  if (!menu || !currentPuzzle || !level) {
    return <><h2>Loading...</h2></>;
  } else {
    const puzzleWithEncoder = currentPuzzle.encoding ? currentPuzzle : {
      ...currentPuzzle,
      encoding: menu.encodingProviders[currentPuzzle.encoding_name]
    };

    // Generate a share string for this puzzle context
    const shareString = `I solved the ${level.levelName.join(" ")} puzzle in the ${category?.name || ""} category!`;
    return <>
      <PlayPuzzle
        puzzle={puzzleWithEncoder}
        puzzleShareString={shareString}
        onWin={handleWin}
        hasWon={hasWon}
        onShareWin={() => console.log("Share win not implemented")}
      />
      {hasWon && <button type={"button"} onClick={goNext}>Next Puzzle</button>}
    </>
  }

  function handleWin() {
    setHasWon(true);
  }

  function goNext() {
    if (!level || !currentPuzzle) {
      return;
    }
    const nextPuzzleIndex = level.puzzles.indexOf(currentPuzzle) + 1;
    if (nextPuzzleIndex < level.puzzles.length) {
      setCurrentPuzzle(level.puzzles[nextPuzzleIndex]);
      setHasWon(false);
    }
  }
}

export default LevelPlay;
