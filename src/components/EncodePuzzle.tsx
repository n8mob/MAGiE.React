import React, { useCallback, useEffect } from "react";
import { useBasePuzzle, PuzzleProps } from "./useBasePuzzle";
import { DisplayMatrix } from "./DisplayMatrix";

const EncodePuzzle: React.FC<PuzzleProps> = (props) => {
  const {
    displayMatrixRef,
    currentPuzzle,
    guessBits,
    setGuessBits,
    displayRows,
    judgment,
    updateJudgment,
  } = useBasePuzzle(props);

  // Handle key down for bit input
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!currentPuzzle) return;
    switch (event.key) {
      case "0":
      case "1": {
        setGuessBits(guessBits.appendBit(event.key));
        updateJudgment();
        break;
      }
      case "Backspace": {
        setGuessBits(guessBits.slice(0, -1));
        updateJudgment();
        break;
      }
      default:
        break;
    }
  }, [currentPuzzle, guessBits, setGuessBits, updateJudgment]);

  // Handle bit click for toggling bits
  const handleBitClick = useCallback((event: any) => {
    const bitIndex = event.target.dataset.bitIndex;
    if (bitIndex === undefined) return;
    const index = parseInt(bitIndex);
    setGuessBits(guessBits.toggleBit(index));
    updateJudgment();
  }, [guessBits, setGuessBits, updateJudgment]);

  // Attach keydown listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!currentPuzzle) return <></>;

  return (
    <>
      <div id="main-display">
        {[...currentPuzzle.clue].map((clueLine, clueIndex) => <p key={clueIndex}>{clueLine}</p>)}
        <DisplayMatrix
          ref={displayMatrixRef}
          displayRows={displayRows}
          judgments={judgment.sequenceJudgments}
          handleBitClick={handleBitClick}
        />
        {judgment.isCorrect && [...currentPuzzle.winMessage].map((winLine, winIndex) => <p key={`win-text-${winIndex}`}>{winLine}</p>)}
      </div>
      <div id="puzzle-inputs">
        <p>Type "0" or "1" to input bits. Use "Backspace" to delete.</p>
      </div>
    </>
  );
};

export { EncodePuzzle };
