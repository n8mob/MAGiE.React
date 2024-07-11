import {Menu, Level, Puzzle} from "../Menu.ts";
import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import EncodePuzzle from "./EncodePuzzle.tsx";
import DecodePuzzle from "./DecodePuzzle.tsx";

interface LevelPlayProps {
  menu: Menu | null;
}

const LevelPlay: React.FC<LevelPlayProps> = (
  {
    menu,
  }) => {
  const {levelNumber, puzzleId} = useParams();
  const categoryName = decodeURIComponent(useParams().categoryName || "");
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [winMessage, setWinMessage] = useState<string[]>([]);
  const [hasWon, setHasWon] = useState(false);


  useEffect(() => {
    if (!categoryName) {
      console.error('Missing category name');
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
      <EncodePuzzle puzzle={currentPuzzle} onWin={handleWin}/>
      <DecodePuzzle puzzle={currentPuzzle} onWin={handleWin} displayWidth={13}/>
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
      alert('End of level');
    }
  }
}

export default LevelPlay;
