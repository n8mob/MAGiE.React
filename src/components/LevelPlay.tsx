import { Menu, Level, Puzzle } from "../Menu.ts";
import { FC, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EncodePuzzle from "./EncodePuzzle.tsx";
import DecodePuzzle from "./DecodePuzzle.tsx";

interface LevelPlayProps {
  menu: Menu | null;
  setShowBackButton: (show: boolean) => void;
  setBackPath: (path: string) => void;
}

const LevelPlay: FC<LevelPlayProps> = ({ menu, setShowBackButton, setBackPath }) => {
  const { levelNumber, puzzleId } = useParams();
  const [level, setLevel] = useState<Level | null>(null);
  const categoryName = decodeURIComponent(useParams().categoryName || "");
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [winMessage, setWinMessage] = useState<string[]>([]);
  const [hasWon, setHasWon] = useState(false);

  useEffect(() => {
    setShowBackButton(true);
    setBackPath(`/categories/${encodeURIComponent(categoryName)}`);
  }, [setShowBackButton, setBackPath, categoryName]);

  useEffect(() => {
    if (!menu || !categoryName || !levelNumber) {
      return;
    }

    if (!levelNumber) {
      console.error('Missing level number');
      return;
    }

    if (!menu || !(categoryName in menu.categories)) {
      console.error(`Cannot find category "${categoryName}"`);
      return;
    }

    const category = menu.categories[decodeURIComponent(categoryName)];
    if (!category) {
      console.error(`Cannot find category "${categoryName}"`);
      return;
    }

    const level = category.levels.find(level => level.levelNumber == levelNumber);
    if (!level) {
      console.error(`Cannot find level ${levelNumber}`);
      return;
    } else {
      setLevel(level);
    }

    if (!puzzleId) {
      console.error('Missing puzzle ID');
      return;
    } else {
      setCurrentPuzzle(level.puzzles[parseInt(puzzleId)]);
    }

  }, [categoryName, levelNumber, menu, puzzleId]);

  if (!currentPuzzle || !level) {
    return <><h2>Loading...</h2></>;
  } else {
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
      {hasWon && <input type="button" value="Next Puzzle" onClick={goNext} />}
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
