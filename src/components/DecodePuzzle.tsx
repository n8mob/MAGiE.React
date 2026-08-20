import { PuzzleProps, useBasePuzzle } from "./useBasePuzzle";
import { DisplayMatrix } from "./DisplayMatrix";
import { CorrectnessBitButton } from "./BitButton.tsx";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { BitSequence } from "../BitSequence";
import { OnScreenKeyboard } from "./OnScreenKeyboard.tsx";
import { GuessDisplay } from "./GuessDisplay.tsx";
import { Correctness } from "../judgment/BitJudgment.ts";
import { WinScreen } from "./WinScreen.tsx";
import { AfterWinControls, InlineWinMessage } from "./InlineWin.tsx";
import { isWinInline } from "../model.ts";

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
    winActions,
    winInline = false,
    bitButtonWidthPx = 32
  }) => {
  const [guessText, setGuessText] = useState<string>(() => sanitizeGuessText(puzzle.init));
  const guessBits = useMemo(
    () => puzzle?.encoding?.encodeText(guessText) || BitSequence.empty(),
    [puzzle, guessText]
  );

  const {
    displayMatrixRef,
    mainDisplayRef,
    puzzleInputsRef,
    displayRows,
    judgment,
    hasWon,
    isAutoWin
  } = useBasePuzzle({
    puzzle: puzzle,
    guessBits,
    onWin,
    onShareWin,
    bitButtonWidthPx,
  });

  // See EncodePuzzle: an already-solved screen and a tutorial lesson both talk
  // about the bits on display, which a modal would cover.
  const winsInline = isWinInline(puzzle, winInline);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuessText(sanitizeGuessText(puzzle.init));
  }, [puzzle.init]);

  // Judging and scrolling both react to guessBits changes in useBasePuzzle.
  const updateGuessText = useCallback((rawGuessText: string) => {
    if (hasWon) {
      return;
    }
    setGuessText(sanitizeGuessText(rawGuessText));
  }, [hasWon]);

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
            showAnnotations={false}
            renderBit={(bit, rowIndex, indexWithinRow) => (
              <CorrectnessBitButton
                key={`bit-${bit.index}`}
                bit={bit}
                correctness={
                judgment.sequenceJudgments[rowIndex]?.bitJudgments?.[indexWithinRow]?.correctness
                  ?? Correctness.unguessed}
              />
            )}
          />
        </div>
        <div id="puzzle-inputs" className="decode-puzzle-inputs" ref={puzzleInputsRef}>
          {!isAutoWin &&
            <GuessDisplay
              guessText={guessText}
              placeholder="DECODE TEXT HERE"
              showCursor={!hasWon}
            />
          }
          {!hasWon && (
            <OnScreenKeyboard
              onCharacter={appendCharacter}
              onDelete={deleteCharacter}
              onReturn={checkAnswer}
            />
          )}
          {/* Same as Encode: on the tutorial's already-solved demo screens this
              text captions the bits above it rather than rewarding anything, so
              it stays inline instead of covering its own subject. */}
          <InlineWinMessage show={hasWon && winsInline} winMessage={puzzle.winMessage ?? []} />
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
      {/* See EncodePuzzle: the demo screens keep the controls they had, and the
          flag must be useBasePuzzle's so a parent reset can't wipe it (#223). */}
      <AfterWinControls show={hasWon && winsInline} actions={winActions} />
    </>
  );
}

export { DecodePuzzle };
