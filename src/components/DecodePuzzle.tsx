import {Puzzle} from "../Menu.ts";
import React from "react";

interface DecodePuzzleProps {
  puzzle?: Puzzle,
  onWin: () => void;
}

const DecodePuzzle: React.FC<DecodePuzzleProps> = ({puzzle}) => {
  if (!puzzle || puzzle.type != "Decode") {
    return;
  }

  return <>
    {[...puzzle.winText].map((char, index) =>
      <input type="checkbox" key={`winText-${index}`} checked={char == '1'}/>)
    }
    <input type="text" id="decodeInput" value={puzzle.init}/>
  </>
}

export default DecodePuzzle;