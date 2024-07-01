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
    <h3>This is a decoding puzzle.</h3>
  </>
}

export default DecodePuzzle;