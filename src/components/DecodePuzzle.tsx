import {Puzzle} from "../Menu.ts";
import React from "react";

interface DecodePuzzleProps {
  puzzle?: Puzzle
}

const DecodePuzzle: React.FC<DecodePuzzleProps> = ({puzzle}) => {
  if (!puzzle || puzzle.type != "Decode") {
    return null;
  }

  return <>
    {[...puzzle.init].map((char, index) => <input type="checkbox" key={index} checked={char == '1'} />)}
  </>
}

export default DecodePuzzle;