import {Puzzle} from "../Menu.ts";
import React from "react";

interface EncodePuzzleProps {
  puzzle?: Puzzle
}

const EncodePuzzle: React.FC<EncodePuzzleProps> = ({puzzle}) => {
  if (!puzzle || puzzle.type != "Encode") {
    return null;
  }

  return <>
    <h3>This is an encoding puzzle.</h3>
  </>
}

export default EncodePuzzle;
