import {Puzzle} from "../Menu.ts";
import React from "react";

interface EncodePuzzleProps {
  puzzle?: Puzzle
}

const EncodePuzzle: React.FC<EncodePuzzleProps> = ({puzzle}) => {
  if (!puzzle || puzzle.type != "Encode") {
    return null;
  }

  const bits = [...puzzle.encoding.encodeText(puzzle.init)];

  return <>
    {bits.map((char, index) =>
      <input type="checkbox" key={index} defaultChecked={char == '1'} />
    )}
  </>
}

export default EncodePuzzle;
