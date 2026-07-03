import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from "react";
import { CorrectnessBitButton } from "./BitButton.tsx";
import { BitInputs } from "./BitInputs.tsx";
import { PuzzleProps, useBasePuzzle } from "./useBasePuzzle";
import { DisplayMatrix } from "./DisplayMatrix";
import { BitSequence } from "../BitSequence.ts";
import { Correctness } from "../judgment/BitJudgment.ts";

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
    bitButtonWidthPx
  });

  const displayRows = useMemo(
    () => Array.from(puzzle.encoding.splitForDisplay(guessBits, displayWidth)
    ), [puzzle, guessBits, displayWidth]);

  const appendBit = useCallback((bit: "0" | "1") => {
    setGuessBits(prev => prev.appendBit(bit));
  }, []);

  const deleteBit = useCallback(() => {
    setGuessBits(prev => prev.slice(0, -1));
  }, []);

  // Handle key down for entering bits from the 1 and 0 keys
  // (and backspace for deleting bits)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!puzzle) {
      return;
    }
    switch (event.key) {
      case "0":
      case "1": {
        appendBit(event.key);
        break;
      }
      case "Backspace": {
        deleteBit();
        break;
      }
      default:
        break;
    }
  }, [puzzle, appendBit, deleteBit]);

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
          renderBit={(bit, rowIndex, indexWithinRow) => (
            <CorrectnessBitButton
              key={`bit-${bit.index}`}
              bit={bit}
              correctness={judgment.sequenceJudgments[rowIndex]?.bitJudgments?.[indexWithinRow]?.correctness
                ?? Correctness.unguessed}
              onChange={handleBitClick}
            />
          )}
        />
        {judgment.isCorrect && [...puzzle.winMessage].map((winLine, winIndex) =>
          <p key={`win-text-${winIndex}`}>{winLine}</p>)}
      </div>
      {!hasWon && (
        <div id="puzzle-inputs" className="encode-puzzle-inputs">
          <div className="encode-guess-display" aria-label="Current guess">
          <span className={guessBits.length > 0 ? "encode-guess-text" : "encode-guess-placeholder"}>
            {guessBits.length > 0 ? guessBits.toString() : "DECODE TEXT HERE"}
          </span>
            <span className="encode-guess-cursor blink" aria-hidden="true">_</span>
          </div>
          <BitInputs
            onBit={appendBit}
            onDelete={deleteBit}
            onSubmit={() => {}}
            disabled={hasWon}
          />
        </div>)}
    </>
  )
    ;
};

export { EncodePuzzle };
