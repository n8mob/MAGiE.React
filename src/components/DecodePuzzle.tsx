import { PuzzleProps, useBasePuzzle } from "./useBasePuzzle";
import { DisplayMatrix } from "./DisplayMatrix";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BitSequence } from "../BitSequence";
import { debug } from "../Logger.ts";
import { OnScreenKeyboard } from "./OnScreenKeyboard.tsx";

const LETTER_PATTERN = /^[a-z]$/i;
const ALLOWED_PUNCTUATION = new Set<string>([",", ".", "!", "?", " "]);

const normalizeDecodeCharacter = (rawCharacter: string): string | null => {
  if (LETTER_PATTERN.test(rawCharacter)) {
    return rawCharacter.toUpperCase();
  }

  if (ALLOWED_PUNCTUATION.has(rawCharacter)) {
    return rawCharacter;
  }

  return null;
};

const sanitizeGuessText = (rawGuessText: string): string => Array.from(rawGuessText)
  .map((character) => normalizeDecodeCharacter(character) ?? "")
  .join("");

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.isContentEditable
    || target.tagName === "INPUT"
    || target.tagName === "TEXTAREA"
    || target.tagName === "SELECT";
};

const DecodePuzzle: FC<PuzzleProps> = (
  {
    puzzle,
    onWin = () => {},
    onShareWin = () => {},
    bitButtonWidthPx = 32
  }) => {
  const [guessText, setGuessText] = useState<string>(() => sanitizeGuessText(puzzle.init));
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
  });

  // Compute winBits and displayRows for decode-type puzzles
  const displayRows = useMemo(
    () => {
      const winBits = puzzle.encoding.encodeText(puzzle.winText);
      const displayBits = winBits.appendBits(guessBits.slice(winBits.length))
      return Array.from(puzzle.encoding.splitForDisplay(displayBits, displayWidth));
    },
    [puzzle.encoding, puzzle.winText, guessBits, displayWidth]);

  const mainDisplayRef = useRef<HTMLDivElement>(null);
  const puzzleInputsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGuessText(sanitizeGuessText(puzzle.init));
  }, [puzzle.init]);

  const scrollChangedBitIntoView = useCallback((lastChangedIndex: number) => {
    if (lastChangedIndex < 0) {
      return;
    }

    // Find which row contains this bit.
    let rowIndex = -1;
    for (let i = 0; i < displayRows.length; ++i) {
      const row = displayRows[i];
      if (row.length < 1) {
        continue;
      }
      const firstBitIndex = row.firstBit().index;
      const lastBitIndex = row.lastBit().index;
      if (lastChangedIndex >= firstBitIndex && lastChangedIndex <= lastBitIndex) {
        rowIndex = i;
        break;
      }
    }

    // Scroll the row into view but keep #puzzle-inputs visible.
    if (rowIndex < 0
      || !displayMatrixRef.current
      || typeof displayMatrixRef.current.getBitRowElement !== "function"
    ) {
      return;
    }

    const lastChangedRow = displayMatrixRef.current.getBitRowElement(rowIndex);
    const mainDisplay = mainDisplayRef.current;
    const puzzleInputs = puzzleInputsRef.current;
    if (!lastChangedRow || !mainDisplay || !puzzleInputs) {
      return;
    }

    const rowRect = lastChangedRow.getBoundingClientRect();
    const mainRect = mainDisplay.getBoundingClientRect();
    const inputsRect = puzzleInputs.getBoundingClientRect();
    const contextFactor = 6;
    const newScrollTop = rowRect.top - mainRect.top + mainDisplay.scrollTop - (mainRect.height / contextFactor);
    mainDisplay.scrollTo({
      top: newScrollTop,
      behavior: "smooth"
    });
    if (rowRect.bottom > mainRect.bottom) {
      const maxScroll = (inputsRect.top) - mainRect.top - lastChangedRow.offsetHeight;
      mainDisplay.scrollTop += Math.min(rowRect.bottom - mainRect.bottom, maxScroll);
    } else if (rowRect.top < mainRect.top) {
      mainDisplay.scrollTop += rowRect.top - mainRect.top;
    }
  }, [displayRows, displayMatrixRef]);

  const updateGuessText = useCallback((rawGuessText: string) => {
    if (hasWon) {
      return;
    }

    const previousGuessBits = guessBits;
    const nextGuessText = sanitizeGuessText(rawGuessText);
    setGuessText(nextGuessText);
    const nextGuessBits = puzzle.encoding.encodeText(nextGuessText);

    // Scroll logic: scroll the row containing the last changed bit into view.
    let lastChangedIndex = -1;
    const minLen = Math.min(previousGuessBits.length, nextGuessBits.length);
    for (let i = 0; i < minLen; ++i) {
      if (previousGuessBits.getBit(i) !== nextGuessBits.getBit(i)) {
        lastChangedIndex = i;
      }
    }
    if (nextGuessBits.length > previousGuessBits.length) {
      lastChangedIndex = nextGuessBits.length - 1;
    } else if (nextGuessBits.length < previousGuessBits.length) {
      lastChangedIndex = Math.max(nextGuessBits.length - 1, 0);
    }

    scrollChangedBitIntoView(lastChangedIndex);
  }, [guessBits, hasWon, puzzle.encoding, scrollChangedBitIntoView]);

  const appendCharacter = useCallback((character: string) => {
    if (hasWon) {
      return;
    }

    const normalizedCharacter = normalizeDecodeCharacter(character);
    if (!normalizedCharacter) {
      return;
    }

    updateGuessText(`${guessText}${normalizedCharacter}`);
  }, [guessText, hasWon, updateGuessText]);

  const deleteCharacter = useCallback(() => {
    if (hasWon || guessText.length < 1) {
      return;
    }
    updateGuessText(guessText.slice(0, -1));
  }, [guessText, hasWon, updateGuessText]);

  const checkAnswer = useCallback(() => {
    if (hasWon) {
      return;
    }

    // Decoding answers are judged on every keystroke; "Return" is an explicit re-check trigger.
    updateGuessText(guessText);
  }, [guessText, hasWon, updateGuessText]);

  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (hasWon || isEditableTarget(event.target)) {
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        deleteCharacter();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        checkAnswer();
        return;
      }

      const normalizedCharacter = normalizeDecodeCharacter(event.key);
      if (normalizedCharacter) {
        event.preventDefault();
        appendCharacter(normalizedCharacter);
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [appendCharacter, checkAnswer, deleteCharacter, hasWon]);

  if (!puzzle) {
    return <></>;
  }

  debug(`hasWon: ${hasWon}, puzzle.init: ${puzzle.init}, winText: ${puzzle.winText}, guessText: ${guessText}`);

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
            judgments={judgment.sequenceJudgments}
            handleBitClick={() => {
            }}
          />
          <div id="win-message">
            {hasWon && puzzle.init !== puzzle.winText && <p>{guessText}</p>}
            {judgment.isCorrect && [...puzzle.winMessage].map((winLine, winIndex) =>
              <p key={`win-message-${winIndex}`}>{winLine}</p>)}
          </div>
        </div>
        {!hasWon && (
          <div id="puzzle-inputs" ref={puzzleInputsRef}>
            <div className="decode-guess-display" aria-label="Current guess">
              <span className={guessText.length > 0 ? "decode-guess-text" : "decode-guess-placeholder"}>
                {guessText.length > 0 ? guessText : "DECODE TEXT HERE"}
              </span>
              <span className="decode-guess-cursor blink" aria-hidden="true">_</span>
            </div>
            <OnScreenKeyboard
              onCharacter={appendCharacter}
              onDelete={deleteCharacter}
              onReturn={checkAnswer}
              disabled={hasWon}
            />
          </div>
        )}
      </div>
    </>
  );
}

export { DecodePuzzle };
