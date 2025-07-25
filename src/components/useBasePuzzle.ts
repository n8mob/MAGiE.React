import { useState, useRef, useEffect, useCallback } from "react";
import { Puzzle } from "../model.ts";
import { BinaryJudge, BitJudge, NewSequenceJudgment } from "../judgment/BinaryJudge.ts";
import { FullJudgment } from "../judgment/FullJudgment.ts";
import { DisplayRow } from "../encoding/DisplayRow.ts";
import { BitSequence } from "../BitSequence.ts";
import ReactGA4 from "react-ga4";
import { VariableWidthEncoder } from "../encoding/VariableWidthEncoder.ts";
import { VariableWidthDecodingJudge } from "../judgment/VariableWidthDecodingJudge.ts";
import { FixedWidthEncoder } from "../encoding/FixedWidthEncoder.ts";
import { FixedWidthDecodingJudge } from "../judgment/FixedWidthDecodingJudge.ts";
import { VariableWidthEncodingJudge } from "../judgment/VariableWidthEncodingJudge.ts";
import { FixedWidthEncodingJudge } from "../judgment/FixedWidthEncodingJudge.ts";

export interface PuzzleProps {
  puzzle: Puzzle;
  onWin: () => void;
  onShareWin: () => void;
  bitDisplayWidthPx: number;
  bitJudge?: BitJudge;
  newSequenceJudgment?: NewSequenceJudgment;
}

export function useBasePuzzle(props: PuzzleProps) {
  const displayMatrixRef = useRef<any>(null);

  // Individual state variables
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | undefined>(props.puzzle);
  const [guessText, setGuessText] = useState<string>(props.puzzle.init || "");
  const [guessBits, setGuessBits] = useState<BitSequence>(props.puzzle.encoding ? props.puzzle.encoding.encodeText(props.puzzle.init || "") : BitSequence.empty());
  const [winBits, setWinBits] = useState<BitSequence>(props.puzzle.encoding ? props.puzzle.encoding.encodeText(props.puzzle.winText) : BitSequence.empty());
  const [displayRows, setDisplayRows] = useState<DisplayRow[]>([]);
  const [judgment, setJudgment] = useState<FullJudgment>(new FullJudgment(false, BitSequence.empty(), []));
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [bitDisplayWidthPx, setBitDisplayWidthPx] = useState<number>(props.bitDisplayWidthPx);
  const [displayWidth, setDisplayWidth] = useState<number>(0);
  const [judge, setJudge] = useState<BinaryJudge | undefined>(undefined);

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

  // Update display width on mount and resize
  const updateDisplayWidth = useCallback(() => {
    if (displayMatrixRef.current) {
      const displayMatrixWidth = displayMatrixRef.current.getWidth();
      const newDisplayWidth = Math.floor(displayMatrixWidth / bitDisplayWidthPx);
      setDisplayWidth(newDisplayWidth);
    }
  }, [bitDisplayWidthPx]);

  useEffect(() => {
    updateDisplayWidth();
    window.addEventListener("resize", updateDisplayWidth);
    return () => window.removeEventListener("resize", updateDisplayWidth);
  }, [updateDisplayWidth]);

  // Judge setup
  const updateJudge = useCallback((puzzle: Puzzle) => {
    if (!puzzle.encoding) return;
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
    setJudge(newJudge);
  }, []);

  // Update judgment
  const updateJudgment = useCallback(() => {
    if (!currentPuzzle || !judge) return;
    const splitter = (bits: BitSequence) => currentPuzzle.encoding.splitForDisplay(bits, displayWidth);
    const newJudgment = judge.judgeBits(guessBits, winBits, splitter, props.bitJudge, props.newSequenceJudgment);
    if (newJudgment && !newJudgment.equals(judgment)) {
      setJudgment(newJudgment);
      displayMatrixRef.current?.updateJudgment(newJudgment.sequenceJudgments);
      const eventParams = {
        puzzle_slug: currentPuzzle.slug,
        guess_bits: guessBits,
        guess_text: guessText,
        winText: currentPuzzle.winText,
        encoding: currentPuzzle.encoding_name,
        encoding_type: currentPuzzle.encoding.getType(),
        judgment_is_correct: newJudgment.isCorrect,
        pagePath: window.location.pathname + window.location.search,
      };
      if (newJudgment.isCorrect) {
        ReactGA4.event("winning_judgment", eventParams);
        props.onWin();
      } else {
        ReactGA4.event("guess", eventParams);
      }
    }
    updateDisplayRows();
  }, [currentPuzzle, judge, guessBits, winBits, judgment, displayWidth, guessText, props]);

  // Update display rows
  const updateDisplayRows = useCallback(() => {
    if (!currentPuzzle) return;
    const newDisplayRows: DisplayRow[] = [...currentPuzzle.encoding.splitForDisplay(guessBits, displayWidth)];
    setDisplayRows(newDisplayRows);
  }, [currentPuzzle, guessBits, displayWidth]);

  // Update puzzle when prop changes
  useEffect(() => {
    setCurrentPuzzle(props.puzzle);
    setGuessText(props.puzzle.init || "");
    setGuessBits(props.puzzle.encoding ? props.puzzle.encoding.encodeText(props.puzzle.init || "") : BitSequence.empty());
    setWinBits(props.puzzle.encoding ? props.puzzle.encoding.encodeText(props.puzzle.winText) : BitSequence.empty());
    setJudgment(new FullJudgment(false, BitSequence.empty(), []));
    setHasWon(false);
    setUpdating(false);
    setBitDisplayWidthPx(props.bitDisplayWidthPx);
    setDisplayRows([]);
    updateJudge(props.puzzle);
  }, [props.puzzle, props.bitDisplayWidthPx, updateJudge]);

  // Update judgment when relevant state changes
  useEffect(() => {
    updateJudgment();
  }, [currentPuzzle, guessText, guessBits, winBits, judge, displayWidth]);

  return {
    displayMatrixRef,
    currentPuzzle,
    setCurrentPuzzle,
    guessText,
    setGuessText,
    guessBits,
    setGuessBits,
    winBits,
    setWinBits,
    displayRows,
    setDisplayRows,
    judgment,
    setJudgment,
    hasWon,
    setHasWon,
    updating,
    setUpdating,
    bitDisplayWidthPx,
    setBitDisplayWidthPx,
    displayWidth,
    setDisplayWidth,
    judge,
    setJudge,
    updateJudgment,
    updateDisplayRows,
  };
}
