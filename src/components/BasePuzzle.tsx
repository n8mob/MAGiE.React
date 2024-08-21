import React from "react";
import usePuzzle from "../hooks/usePuzzle.ts";
import DisplayMatrix from "./DisplayMatrix.tsx";
import { Puzzle } from "../Menu.ts";

interface PuzzleProps {
  puzzle: Puzzle;
  displayWidth: number;
  onWin: () => void;
  onUpdateJudge: (puzzle: Puzzle) => void;
}

const BasePuzzle: React.FC<PuzzleProps> = ({ puzzle, displayWidth, onWin, onUpdateJudge }) => {
  const { state, displayMatrixRef, handleSubmitClick } = usePuzzle({ puzzle, displayWidth, onWin, onUpdateJudge });

  return (
    <>
      <DisplayMatrix
        ref={displayMatrixRef}
        bits={state.guessBits}
        judgments={state.judgment.sequenceJudgments}
        handleBitClick={() => {
        }} // read-only bits, EncodePuzzle can add an update function.
      />
      <div className={"encodingInputs"}>
        <input type="button" value="Check Answer" onClick={handleSubmitClick} />
      </div>
    </>
  );
};

export default BasePuzzle;
