import { useEffect, useMemo, useRef, useState } from "react";
import { Puzzle } from "../model.ts";
import { BinaryJudge } from "../judgment/BinaryJudge.ts";
import { FullJudgment } from "../judgment/FullJudgment.ts";
import { BitSequence } from "../BitSequence.ts";
import ReactGA4 from "react-ga4";
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
    return puzzle.encoding.encodeText(puzzle.winText);
  }, [puzzle]);

  const isAutoWin = useMemo(() => puzzle.init === puzzle.winText, [puzzle]);

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

    const guessText = puzzle.encoding?.decodeText(guessBits) ?? "missing encoding";

    const splitter = (bits: BitSequence) => puzzle.encoding.splitForDisplay(bits, displayWidthInBitCount);

    const newJudgment = judge.judgeBits(guessBits, winBits, splitter);
    if (previousJudgment.current && previousJudgment.current.equals(newJudgment)) {
      debug("No change in judgment, skipping update.");
      return;
    }

    setJudgment(newJudgment);
    displayMatrixRef.current?.updateJudgment(newJudgment.sequenceJudgments);

    const eventParams = {
      puzzle_slug: puzzle.slug,
      guess_text: guessText,
      winText: puzzle.winText,
      encoding: puzzle.encoding_name,
      encoding_type: puzzle.encoding.getType(),
      judgment_is_correct: newJudgment.isCorrect,
      pagePath: window.location.pathname + window.location.search,
    };
    if (newJudgment.isCorrect) {
      ReactGA4.event("winning_judgment", eventParams);
      setHasWon(true);
      onWin();
    } else {
      ReactGA4.event("guess", eventParams);
    }
  }, [puzzle, judge, guessBits, winBits, displayWidthInBitCount, onWin]);

  return {
    displayMatrixRef,
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
