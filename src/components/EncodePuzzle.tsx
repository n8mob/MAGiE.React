import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { CorrectnessBitButton } from "./BitButton.tsx";
import { BitInputs } from "./BitInputs.tsx";
import { GuessDisplay } from "./GuessDisplay.tsx";
import { PuzzleProps, useBasePuzzle } from "./useBasePuzzle";
import { DisplayMatrix } from "./DisplayMatrix";
import { BitSequence } from "../BitSequence.ts";
import { Correctness } from "../judgment/BitJudgment.ts";
import { useBitSounds } from "../hooks/useBitSounds.ts";
import { WinScreen } from "./WinScreen.tsx";

const EncodePuzzle: FC<PuzzleProps> = (
  {
    puzzle,
    onWin = () => {},
    onShareWin = () => {},
    winActions,
    winInline = false,
    bitButtonWidthPx = 32
  }) => {
  const [guessBits, setGuessBits] = useState(puzzle?.encoding?.encodeText(puzzle?.init) || BitSequence.empty());
  const guessText = useMemo(
    () => puzzle?.encoding?.decodeText(guessBits) || "",
    [puzzle, guessBits]
  );
  useBitSounds(guessBits);

  const {
    displayMatrixRef,
    mainDisplayRef,
    puzzleInputsRef,
    displayRows,
    judgment,
    hasWon,
    isAutoWin
  } = useBasePuzzle({
    puzzle,
    guessBits,
    onWin,
    onShareWin,
    bitButtonWidthPx
  });

  /*
   * Two roads to the same place. An auto-win screen arrives already solved, so
   * its win text captions the bits rather than rewarding anything; a tutorial
   * lesson points at those bits outright ("SEE HOW THE BIT WENT FROM PURPLE TO
   * GREEN?"). Either way a modal would cover its own subject, so the win stays
   * inline and only an earned win outside the tutorial gets the screen.
   */
  const winsInline = isAutoWin || winInline;

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

  // Functional update, not guessBits.toggleBit: two taps landing before a
  // re-render would otherwise both read the same stale sequence, so the second
  // one silently discards the first.
  const handleBitToggle = useCallback((index: number) => {
    setGuessBits(prev => prev.toggleBit(index));
  }, [setGuessBits]);

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
            showAnnotations={true}
            renderBit={(bit, rowIndex, indexWithinRow) => (
              <CorrectnessBitButton
                key={`bit-${bit.index}`}
                bit={bit}
                correctness={
                  judgment.sequenceJudgments[rowIndex]?.bitJudgments?.[indexWithinRow]?.correctness
                  ?? Correctness.unguessed}
                onBitToggle={handleBitToggle}
              />
            )}
          />
        </div>
        <div id="puzzle-inputs" ref={puzzleInputsRef}>
          {!isAutoWin && puzzle.winText != null && puzzle.winText.length > 0 &&
            <GuessDisplay guessText={guessText} placeholder="YOUR GUESS HERE" showCursor={!hasWon} />
          }
          {!hasWon && (
            <BitInputs
              onBit={appendBit}
              onDelete={deleteBit}
              onSubmit={() => {}}
            />)}
          {/* The tutorial's demo screens arrive already solved. Nothing was
              accomplished, and this text is a caption for the bits above it —
              "THIS IS A BIT" / "IT IS .ON." — not a reward. It stays inline,
              because a screen that covers its own subject teaches nothing. A win
              the player earned gets the WinScreen instead. */}
          {hasWon && winsInline && (
            <div id="win-message" className="display">
              {[...(puzzle.winMessage ?? [])].map((winLine, winIndex) =>
                <p key={`win-message-${winIndex}`}>{winLine}</p>)}
            </div>
          )}
        </div>
        {!winsInline && (
          <WinScreen
            won={hasWon}
            clue={puzzle.clue ?? []}
            answer={puzzle.winText}
            winMessage={puzzle.winMessage ?? []}
            actions={winActions}
          />
        )}
      </div>
      {/* Where the after-win controls sat when PlayPuzzle rendered them, so the
          demo screens are untouched. The flag has to be this one: a parent's own
          copy gets cleared by its reset before the button ever renders (#223),
          which is why useBasePuzzle owns it and the component remounts per
          puzzle. Covered by levelPlayAutoWin.test.tsx. */}
      {hasWon && winsInline && winActions && (
        <div className="after-win-controls">{winActions}</div>
      )}
    </>
  )
    ;
};

export { EncodePuzzle };
