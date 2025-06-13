import { Level, Puzzle } from "../Menu.ts";
import { FC, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { EncodePuzzle } from "./EncodePuzzle.tsx";
import { DecodePuzzle } from "./DecodePuzzle.tsx";
import { useMenu } from "../hooks/useMenu.tsx";
import { useCategory } from "../hooks/useCategory.tsx";

interface LevelPlayProps {
  menuName?: string;
}

const LevelPlay: FC<LevelPlayProps> = ({menuName}) => {
  const {menu, loading, error} = useMenu(menuName);
  const {categoryIndex, levelNumber, puzzleIndex} = useParams();
  const { category } = useCategory(menu, categoryIndex);
  const [level, setLevel] = useState<Level | null>(null);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [winMessage, setWinMessage] = useState<string[]>([]);
  const [hasWon, setHasWon] = useState(false);

  useEffect(() => {
    if (!menu) {
      console.warn('Waiting for the menu.');
      return;
    }

    if (!levelNumber) {
      console.warn('Waiting for the level number.');
      return;
    }

    if (!category) {
      console.warn(`Cannot find category[${categoryIndex}] on the menu "${menuName}]".`);
      return;
    }

    const level = category.levels.find(level => level.levelNumber == levelNumber);
    if (!level) {
      console.error(`Cannot find level ${levelNumber}`);
      return;
    } else {
      setLevel(level);
    }

    if (!puzzleIndex) {
      console.warn("The puzzleNumber is missing. We'll use the first puzzle.");
    }

    setCurrentPuzzle(level.puzzles[parseInt(puzzleIndex || '0', 10)]);

  }, [category, categoryIndex, levelNumber, menu, menuName, puzzleIndex]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading menu!</div>;

  if (!menu || !currentPuzzle || !level) {
    return <><h2>Loading...</h2></>;
  } else {
    if (!currentPuzzle.encoding) {
      currentPuzzle.encoding = menu.encodingProviders[currentPuzzle.encoding_name]
    }
    return <>
      <h2>{level?.levelName.join("\n")}</h2>
      <div className="display">
        {currentPuzzle?.clue.map((line, index) => <p key={index}>{line}</p>)}
      </div>
      {currentPuzzle.type === "Encode" ? (
        <EncodePuzzle
          puzzle={currentPuzzle}
          onWin={handleWin}
          hasWon={hasWon}
          onShareWin={() => console.log("Share win not implemented")}
          bitDisplayWidthPx={32}
        />
      ) : (
        <DecodePuzzle
          puzzle={currentPuzzle}
          onWin={handleWin}
          hasWon={hasWon}
          onShareWin={() => console.log("Share win not implemented")}
          bitDisplayWidthPx={32}
        />
      )}
      <div className="display">
        {winMessage.map((line, index) => <p key={`winMessageLine${index}`}>{line}</p>)}
      </div>
      {hasWon && <input type="button" value="Next Puzzle" onClick={goNext}/>}
    </>
  }

  function handleWin() {
    setWinMessage(currentPuzzle?.winMessage || ["CORRECT!"])
    setHasWon(true);
  }

  function goNext() {
    if (!level || !currentPuzzle) {
      return;
    }
    const nextPuzzleIndex = level.puzzles.indexOf(currentPuzzle) + 1;
    if (nextPuzzleIndex < level.puzzles.length) {
      setCurrentPuzzle(level.puzzles[nextPuzzleIndex]);
      setWinMessage([]);
      setHasWon(false);
    } else {
      const genericWinMessage = [
        "You win!",
        "You finishos",
        "puzzles in",
        "the level"
      ];
      const quote = ["."];
      const closeQuote = [".", "Congrats!"]
      setWinMessage([...genericWinMessage, ...quote, ...level.levelName, ...closeQuote]);
    }
  }
}

export default LevelPlay;
