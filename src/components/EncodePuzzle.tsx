import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from "react";
import { PuzzleProps, useBasePuzzle } from "./useBasePuzzle";
import { DisplayMatrix } from "./DisplayMatrix";
import { BitSequence } from "../BitSequence.ts";

const EncodePuzzle: FC<PuzzleProps> = (
    {
      puzzle,
      onWin = () => {},
      onShareWin = () => {},
      bitButtonWidthPx = 32
    }) => {
  const [guessBits, setGuessBits] = useState(BitSequence.empty());

  const {
    displayMatrixRef,
    judgment,
    hasWon,
    displayWidth
  } = useBasePuzzle({
    puzzle,
    guessBits,
    onWin,
    onShareWin,
    bitButtonWidthPx,
    bitJudge: undefined,
    newSequenceJudgment: undefined,
  });

  const displayRows = useMemo(
    () => Array.from(puzzle.encoding.splitForDisplay(guessBits, displayWidth)
    ), [puzzle, guessBits, displayWidth]);

  // Handle key down for entering bits from the 1 and 0 keys
  // (and backspace for deleting bits)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!puzzle) {
      return;
    }
    switch (event.key) {
      case "0":
      case "1": {
        setGuessBits(guessBits.appendBit(event.key));
        break;
      }
      case "Backspace": {
        setGuessBits(guessBits.slice(0, -1));
        break;
      }
      default:
        break;
    }
  }, [puzzle, guessBits, setGuessBits]);

  // Handle bit click for toggling bits
  // HTMLInputElement instead of a button type because the buttons are actually checkboxes
  const handleBitClick = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const bitIndex = event.target.dataset.bitIndex;
    if (bitIndex === undefined) {
      return;
    }
    const index = parseInt(bitIndex);
    setGuessBits(guessBits.toggleBit(index));
  }, [guessBits, setGuessBits]);

  // Attach keydown listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!puzzle) {
    return <></>;
  }

  return (
    <>
      <div id="main-display">
        {[...puzzle.clue].map((clueLine, clueIndex) => <p key={clueIndex}>{clueLine}</p>)}
        <DisplayMatrix
          ref={displayMatrixRef}
          displayRows={displayRows}
          judgments={judgment.sequenceJudgments}
          handleBitClick={handleBitClick}
        />
        {judgment.isCorrect && [...puzzle.winMessage].map((winLine, winIndex) =>
          <p key={`win-text-${winIndex}`}>{winLine}</p>)}
      </div>
      {hasWon
        ? (<div id="puzzle-inputs">
          <p>Type "0" or "1" to input bits. Use "Backspace" to delete.</p>
        </div>)
        : (<div className={"debug-win-message"}><p>You win!</p></div>)
      }
    </>
  );
};

export { EncodePuzzle };
