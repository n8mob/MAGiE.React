import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from "react";
import { CorrectnessBitButton } from "./BitButton.tsx";
import { BitInputs } from "./BitInputs.tsx";
import { GuessDisplay } from "./GuessDisplay.tsx";
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
  const [guessBits, setGuessBits] = useState(puzzle?.encoding?.encodeText(puzzle?.init) || BitSequence.empty());
  const guessText = useMemo(
    () => puzzle?.encoding?.decodeText(guessBits) || "",
    [puzzle, guessBits]
  );

  const {
    displayMatrixRef,
    mainDisplayRef,
    puzzleInputsRef,
    displayRows,
    judgment,
    hasWon
  } = useBasePuzzle({
    puzzle,
    guessBits,
    onWin,
    onShareWin,
    bitButtonWidthPx
  });

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
    // No crashes!
    return <></>;
  }

  return (
    <>
      <div id="game-content">
        <div id="main-display" className="display" ref={mainDisplayRef}>
          <div id="clue-text">
            {[...puzzle.clue].map((clueLine, clueIndex) => <p key={clueIndex}>{clueLine}</p>)}
          </div>
          <DisplayMatrix
            ref={displayMatrixRef}
            displayRows={displayRows}
            renderBit={(bit, rowIndex, indexWithinRow) => (
              <CorrectnessBitButton
                key={`bit-${bit.index}`}
                bit={bit}
                correctness={
                  judgment.sequenceJudgments[rowIndex]?.bitJudgments?.[indexWithinRow]?.correctness
                  ?? Correctness.unguessed}
                onChange={handleBitClick}
              />
            )}
          />
        </div>
        <div id="puzzle-inputs" ref={puzzleInputsRef}>
          {puzzle.winText != null && puzzle.winText.length > 0 &&
            <GuessDisplay guessText={guessText} placeholder="YOUR GUESS HERE" showCursor={!hasWon} />
          }
          {hasWon ? (
            <div id="win-message" className="display">
              {[...puzzle.winMessage].map((winLine, winIndex) =>
                <p key={`win-message-${winIndex}`}>{winLine}</p>)}
            </div>
          ) : (
            <BitInputs
              onBit={appendBit}
              onDelete={deleteBit}
              onSubmit={() => {}}
              disabled={hasWon}
            />)}
        </div>
      </div>
    </>
  )
    ;
};

export { EncodePuzzle };
