import { PuzzleProps, useBasePuzzle } from "./useBasePuzzle";
import { DisplayMatrix } from "./DisplayMatrix";
import { ChangeEvent, FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BitSequence } from "../BitSequence";

const DecodePuzzle: FC<PuzzleProps> = (
  {
    puzzle,
    onWin = () => {},
    onShareWin = () => {},
    bitButtonWidthPx = 32
  }) => {
  const [guessText, setGuessText] = useState<string>(puzzle.init);
  const guessBits = useMemo(
    () => puzzle?.encoding?.encodeText(guessText) || BitSequence.empty(),
    [puzzle, guessText]
  );

  const {
    displayMatrixRef,
    judgment,
    hasWon,
    displayWidth
  } = useBasePuzzle({
    puzzle: puzzle,
    guessBits,
    onWin,
    onShareWin,
    bitButtonWidthPx,
    bitJudge: undefined,
    newSequenceJudgment: undefined,
  });

  // Compute winBits and displayRows for decode-type puzzles
  const winBits = useMemo(() => puzzle.encoding.encodeText(puzzle.winText), [puzzle]);
  const displayRows = useMemo(() => Array.from(puzzle.encoding.splitForDisplay(winBits, displayWidth)), [puzzle, winBits, displayWidth]);

  const gameContentRef = useRef<HTMLDivElement>(null);
  const mainDisplayRef = useRef<HTMLDivElement>(null);
  const winMessageRef = useRef<HTMLDivElement>(null);
  const puzzleInputsRef = useRef<HTMLDivElement>(null);
  const resizeTimeout = useRef<number | null>(null);

  // Handle guess update
  const handleGuessUpdate = (event: ChangeEvent<HTMLInputElement>) => {
    const prevGuessBits = guessBits;
    const newGuessText = event.target.value.toUpperCase();
    const newGuessBits = puzzle?.encoding.encodeText(newGuessText) || prevGuessBits;
    setGuessText(newGuessText);

    // Scroll logic: scroll the row containing the last-changed bit into view
    let lastChangedIndex = -1;
    const minLen = Math.min(prevGuessBits.length, newGuessBits.length);
    for (let i = 0; i < minLen; ++i) {
      if (prevGuessBits.getBit(i) !== newGuessBits.getBit(i)) {
        lastChangedIndex = i;
      }
    }
    if (newGuessBits.length > prevGuessBits.length) {
      lastChangedIndex = newGuessBits.length - 1;
    }
    // Find which row contains this bit
    let rowIndex = -1;
    if (lastChangedIndex !== -1 && displayRows) {
      for (let i = 0; i < displayRows.length; ++i) {
        const row = displayRows[i];
        if (row.length > 0) {
          const firstBitIndex = row.firstBit().index;
          const lastBitIndex = row.lastBit().index;
          if (lastChangedIndex >= firstBitIndex && lastChangedIndex <= lastBitIndex) {
            rowIndex = i;
            break;
          }
        }
      }
    }
    // Scroll the row into view
    // but keep #puzzle-inputs visible
    if (rowIndex !== -1
      && displayMatrixRef.current
      && typeof displayMatrixRef.current.getBitRowElement === 'function'
    ) {
      const lastChangedRow = displayMatrixRef.current.getBitRowElement(rowIndex);
      const mainDisplay = mainDisplayRef.current;
      const puzzleInputs = puzzleInputsRef.current;
      if (lastChangedRow && mainDisplay && puzzleInputs) {
        const rowRect = lastChangedRow.getBoundingClientRect();
        const mainRect = mainDisplay.getBoundingClientRect();
        const inputsRect = puzzleInputs.getBoundingClientRect();
        const contextFactor = 6;
        const newScrollTop = rowRect.top - mainRect.top + mainDisplay.scrollTop - (mainRect.height / contextFactor);
        mainDisplay.scrollTo({
          top: newScrollTop,
          behavior: 'smooth'
        });
        if (rowRect.bottom > mainRect.bottom) {
          const maxScroll = (inputsRect.top) - mainRect.top - lastChangedRow.offsetHeight;
          mainDisplay.scrollTop += Math.min(rowRect.bottom - mainRect.bottom, maxScroll);
        } else if (rowRect.top < mainRect.top) {
          mainDisplay.scrollTop += rowRect.top - mainRect.top;
        }
      }
    }
  };

  const adjustMainDisplayHeightForInput = useCallback(() => {
    const gameContent = gameContentRef.current;
    const mainDisplay = mainDisplayRef.current;
    if (gameContent && mainDisplay) {
      const windowHeight = window.innerHeight;
      const mainDisplayHeight = mainDisplay.offsetHeight;
      if (windowHeight < mainDisplayHeight * 1.5) {
        gameContent.style.height = windowHeight + 'px';
        gameContent.scrollIntoView({behavior: 'smooth'});
        const puzzleInputs = puzzleInputsRef.current;
        if (puzzleInputs) {
          puzzleInputs.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'nearest'});
        }
      } else {
        gameContent.style.height = '';
      }
    }
  }, []);

  const handleInputFocus = useCallback(() => {
    if (resizeTimeout.current) {
      clearTimeout(resizeTimeout.current);
    }
    resizeTimeout.current = window.setTimeout(() => {
      adjustMainDisplayHeightForInput();
    }, 300);
  }, [adjustMainDisplayHeightForInput]);

  const handleInputBlur = useCallback(() => {
    if (resizeTimeout.current) {
      clearTimeout(resizeTimeout.current);
    }
    resizeTimeout.current = window.setTimeout(() => {
      adjustMainDisplayHeightForInput();
    }, 300);
  }, [adjustMainDisplayHeightForInput]);

  useEffect(() => {
    const input = puzzleInputsRef.current?.querySelector('input');
    if (!input) {
      return;
    }

    input.addEventListener('focus', handleInputFocus, {passive: true});
    input.addEventListener('blur', handleInputBlur, {passive: true});

    return () => {
      if (!input) {
        return;
      }

      input.removeEventListener('focus', handleInputFocus);
      input.removeEventListener('blur', handleInputBlur);

      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
    };
  }, [guessText, handleInputBlur, handleInputFocus]);

  if (!puzzle) {
    return <></>;
  }

  console.debug(`hasWon: ${hasWon}, puzzle.init: ${puzzle.init}, winText: ${puzzle.winText}, guessText: ${guessText}`);

  return (
    <>
      <div id="game-content" ref={gameContentRef}>
        <div id="main-display" className="display" ref={mainDisplayRef}>
          <div id="clue-text">
            {[...puzzle.clue].map((clueLine, clueIndex) => <p key={clueIndex}>{clueLine}</p>)}
          </div>
          <DisplayMatrix
            ref={displayMatrixRef}
            displayRows={displayRows}
            judgments={judgment.sequenceJudgments}
            handleBitClick={() => {
            }}
          />
          <div id="win-message" ref={winMessageRef}>
            {hasWon && puzzle.init !== puzzle.winText && <p>{guessText}</p>}
            {judgment.isCorrect && [...puzzle.winMessage].map((winLine, winIndex) =>
              <p key={`win-message-${winIndex}`}>{winLine}</p>)}
          </div>
        </div>
        {!hasWon && (
          <div id="puzzle-inputs" ref={puzzleInputsRef}>
            <input type="text"
                   inputMode="text"
                   className="decode-input"
                   placeholder={'DECODE TEXT HERE'}
                   autoComplete="off"
                   autoCorrect="off"
                   spellCheck="false"
                   value={guessText}
                   onChange={handleGuessUpdate}
                   enterKeyHint={"done"}/>
          </div>
        )}
      </div>
    </>
  );
}

export { DecodePuzzle };
