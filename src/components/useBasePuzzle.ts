import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Puzzle } from "../model.ts";
import { BinaryJudge } from "../judgment/BinaryJudge.ts";
import { FullJudgment } from "../judgment/FullJudgment.ts";
import { BitSequence } from "../BitSequence.ts";
import { VariableWidthEncoder } from "../encoding/VariableWidthEncoder.ts";
import { VariableWidthDecodingJudge } from "../judgment/VariableWidthDecodingJudge.ts";
import { FixedWidthEncoder } from "../encoding/FixedWidthEncoder.ts";
import { FixedWidthDecodingJudge } from "../judgment/FixedWidthDecodingJudge.ts";
import { VariableWidthEncodingJudge } from "../judgment/VariableWidthEncodingJudge.ts";
import { FixedWidthEncodingJudge } from "../judgment/FixedWidthEncodingJudge.ts";
import { DisplayMatrixUpdate } from "./DisplayMatrix.tsx";
import { debug } from "../Logger.ts";

export interface PuzzleProps {
  puzzle: Puzzle;
  onWin?: () => void;
  onShareWin?: () => void;
  /**
   * Where the player can go once they've won, from whichever route loaded the
   * puzzle. Each mode decides where it belongs: on the win screen for a win the
   * player earned, under the puzzle on the tutorial's auto-win demo screens.
   */
  winActions?: ReactNode;
  bitButtonWidthPx: number;
}

export interface UseBasePuzzleProps {
  puzzle: Puzzle;
  guessBits: BitSequence;
  onWin: () => void;
  onShareWin: () => void;
  bitButtonWidthPx: number;
}

export function useBasePuzzle(
  {
    puzzle,
    guessBits,
    onWin,
    bitButtonWidthPx
  }: UseBasePuzzleProps
) {
  const displayMatrixRef = useRef<DisplayMatrixUpdate>(null);
  const mainDisplayRef = useRef<HTMLDivElement>(null);
  const puzzleInputsRef = useRef<HTMLDivElement>(null);
  const [displayWidthInPx, setDisplayWidthInPx] = useState<number>(window.innerWidth);

  // Individual state variables
  const [judgment, setJudgment] = useState<FullJudgment>(new FullJudgment(false, BitSequence.empty(), []));
  const previousJudgment = useRef<FullJudgment>(judgment);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const displayWidthInBitCount = useMemo(() => {
    if (displayWidthInPx && displayWidthInPx > 0) {
      return Math.floor(displayWidthInPx / bitButtonWidthPx);
    }
    // Default to 13 bits if calculation fails.
    return 13;
  }, [bitButtonWidthPx, displayWidthInPx]);

  const winBits = useMemo(() => {
    if (!puzzle || !puzzle.winText) {
      return BitSequence.empty();
    }
    return puzzle.encoding?.encodeText(puzzle.winText);
  }, [puzzle]);

  const isAutoWin = useMemo(() => puzzle.init === puzzle.winText, [puzzle]);

  // Rows to render. Decode puzzles display the win bits (padded with any overflow
  // guess bits) so the full message is visible; encode puzzles display the guess.
  const displayRows = useMemo(() => {
    if (!puzzle?.encoding || !displayWidthInBitCount || displayWidthInBitCount <= 0) {
      return [];
    }
    const displayBits = puzzle.type === "Encode"
      ? guessBits
      : winBits.appendBits(guessBits.slice(winBits.length));
    return Array.from(puzzle.encoding.splitForDisplay(displayBits, displayWidthInBitCount));
  }, [puzzle, guessBits, winBits, displayWidthInBitCount]);

  // Preload images
  useEffect(() => {
    [
      'assets/Bit_off_Yellow.png',
      'assets/Bit_on_Yellow.png',
      'assets/Bit_off_Teal.png',
      'assets/Bit_on_Teal.png',
      'assets/Bit_off_Purple.png',
      'assets/Bit_on_Purple.png',
    ].forEach(url => {
      const img = new window.Image();
      img.src = url;
    });
  }, []);

  // Update display width on resize
  useEffect(() => {
    const updateDisplayWidth = () => {
      if (displayMatrixRef.current) {
        setDisplayWidthInPx(displayMatrixRef.current.getWidth());
      }
    }

    updateDisplayWidth();

    window.addEventListener("resize", updateDisplayWidth);

    return () => window.removeEventListener("resize", updateDisplayWidth);
  }, []);

  // Judge setup
  const judge = useMemo(() => {
    if (!puzzle || !puzzle.encoding) {
      return;
    }

    let newJudge: BinaryJudge | undefined;
    if (puzzle.encoding instanceof VariableWidthEncoder) {
      newJudge = puzzle.type === "Encode"
        ? new VariableWidthEncodingJudge(puzzle.encoding)
        : new VariableWidthDecodingJudge(puzzle.encoding);
    } else if (puzzle.encoding instanceof FixedWidthEncoder) {
      newJudge = puzzle.type === "Encode"
        ? new FixedWidthEncodingJudge(puzzle.encoding)
        : new FixedWidthDecodingJudge(puzzle.encoding);
    }
    debug(`hooking up judge based on puzzle type: ${puzzle.type} with encoding: ${puzzle.encoding_name} (${puzzle.encoding.getType()})`);
    if (!newJudge) {
      console.warn("No judge available for this puzzle encoding type.");
      return;
    } else {
      debug(`Hooked-up judge: ${newJudge.constructor.name}`);
    }
    return newJudge;
  }, [puzzle]);

  useEffect(() => {
    if (!puzzle || !judge || !displayWidthInBitCount || displayWidthInBitCount <= 0) {
      return;
    }

    const splitter = (bits: BitSequence) => puzzle.encoding.splitForDisplay(bits, displayWidthInBitCount);

    const newJudgment = judge.judgeBits(guessBits, winBits, splitter);
    if (previousJudgment.current && previousJudgment.current.equals(newJudgment)) {
      debug("No change in judgment, skipping update.");
      return;
    }

    previousJudgment.current = newJudgment;
    setJudgment(newJudgment);

    // No analytics here. This runs on every bit toggle, so the old `guess` event
    // fired 50-150 times per puzzle and its guess_text was unbounded cardinality;
    // `winning_judgment` just duplicated the win that onWin() already reports.
    // Both fold into puzzle_end — see docs/magie-analytics-spec.md.
    if (newJudgment.isCorrect) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasWon(true);
      onWin();
    }
  }, [puzzle, judge, guessBits, winBits, displayWidthInBitCount, onWin]);

  // Scroll the row containing the most recently changed bit into view,
  // keeping #puzzle-inputs visible. Runs after render so the row exists in the DOM.
  const previousGuessBits = useRef(guessBits);
  useEffect(() => {
    const prev = previousGuessBits.current;
    if (prev.equals(guessBits)) {
      return;
    }
    previousGuessBits.current = guessBits;

    let lastChangedIndex = -1;
    const minLen = Math.min(prev.length, guessBits.length);
    for (let i = 0; i < minLen; ++i) {
      if (!prev.getBit(i).equals(guessBits.getBit(i))) {
        lastChangedIndex = i;
      }
    }
    if (guessBits.length > prev.length) {
      lastChangedIndex = guessBits.length - 1;
    } else if (guessBits.length < prev.length) {
      lastChangedIndex = Math.max(guessBits.length - 1, 0);
    }
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
      if (lastChangedIndex >= row.firstBit().index && lastChangedIndex <= row.lastBit().index) {
        rowIndex = i;
        break;
      }
    }

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
  }, [guessBits, displayRows]);

  return {
    displayMatrixRef,
    mainDisplayRef,
    puzzleInputsRef,
    displayRows,
    judgment,
    setJudgment,
    hasWon,
    setHasWon,
    updating,
    setUpdating,
    setBitDisplayWidthPx: setDisplayWidthInPx,
    displayWidth: displayWidthInBitCount,
    judge,
    isAutoWin
  };
}
