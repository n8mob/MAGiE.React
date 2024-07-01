import {Menu} from "../Menu.ts";
import React, {useState} from "react";
import {useParams} from "react-router-dom";

interface LevelPlayProps {
  menu: Menu | null;
}

const LevelPlay: React.FC<LevelPlayProps> = (
  {
    menu,
  }) => {
  const {categoryName, levelNumber} = useParams();
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)

  setCurrentPuzzleIndex(0);

  if (!categoryName) {
    return <><h2>Missing category name</h2></>
  }

  if (!levelNumber) {
    return <><h2>Missing level number</h2></>
  }

  if (!menu || !(categoryName in menu.categories)) {
    return <><h2>Cannot find category "{categoryName}"</h2></>;
  }

  const category = menu.categories[categoryName];
  const level = category.levels.find(level => level.levelNumber === levelNumber);

  if (!level) {
    return <><h2>Cannot find level {levelNumber}</h2></>;
  }

  return <div>
    <h2>{level.levelName.join("\n")}</h2>
    <div className="display">
      <p>{level.puzzles[currentPuzzleIndex].clue.join("<br />")}</p>
    </div>
  </div>
}

export default LevelPlay;
