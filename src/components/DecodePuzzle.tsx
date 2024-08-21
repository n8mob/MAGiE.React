import React, { useCallback, useEffect } from "react";
import DisplayMatrix from "./DisplayMatrix.tsx";
import { Puzzle } from "../Menu.ts";
import VariableWidthEncoder from "../encoding/VariableWidthEncoder.ts";
import VariableWidthDecodingJudge from "../judgment/VariableWidthDecodingJudge.ts";
import FixedWidthEncoder from "../encoding/FixedWidthEncoder.ts";
import FixedWidthDecodingJudge from "../judgment/FixedWidthDecodingJudge.ts";
import usePuzzle from "../hooks/usePuzzle.ts";


const DecodePuzzle: React.FC<{
  puzzle: Puzzle;
  displayWidth: number;
  onWin: () => void;
}> = ({ puzzle, displayWidth, onWin }) => {

  const updateJudge = (puzzle: Puzzle) => {
    if (puzzle.encoding instanceof VariableWidthEncoder) {
      setJudge(new VariableWidthDecodingJudge(puzzle.encoding));
    } else if (puzzle.encoding instanceof FixedWidthEncoder) {
      setJudge(new FixedWidthDecodingJudge(puzzle.encoding));
    } else {
      console.error(`Unsupported encoding type: ${puzzle.encoding.getType()}, ${puzzle.encoding_name}`);
    }
  }

  const {
    currentPuzzle,
    guessText,
    winBits,
    judgment,
    setGuessText,
    setGuessBits,
    setJudge,
    displayMatrixRef,
    handleSubmitClick,
  } = usePuzzle({
    puzzle,
    displayWidth,
    onWin,
    onUpdateJudge: updateJudge
  });

  const handleGuessUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newGuessText = event.target.value.toUpperCase();
    setGuessText(newGuessText);
    setGuessBits(currentPuzzle?.encoding.encodeText(newGuessText) || "");
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
        handleSubmitClick();
        break;
      default:
        break;
    }
  }, [handleSubmitClick]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!currentPuzzle) {
    console.error('Missing puzzle');
    return <></>;
  }

  return (
    <>
      <div id="bit-field" className="clue-and-bits">
        {[...currentPuzzle.clue].map((line, index) => <p key={index}>{line}</p>)}
        <DisplayMatrix
          ref={displayMatrixRef}
          bits={winBits}
          judgments={judgment.sequenceJudgments}
          handleBitClick={() => {}}  // bits will be read-only for the decode puzzle
        />
      </div>
      <div className="puzzle-inputs">
        <input type="text" className="decode-input" value={guessText} onChange={handleGuessUpdate} />
        <input type="button" value="Submit" onClick={handleSubmitClick} />
      </div>
    </>
  );
}

export default DecodePuzzle;
