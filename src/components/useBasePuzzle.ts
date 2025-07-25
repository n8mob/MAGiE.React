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

export interface PuzzleState {
  currentPuzzle?: Puzzle;
  judge?: BinaryJudge;
  guessText: string;
  guessBits: BitSequence;
  winBits: BitSequence;
  displayRows: DisplayRow[];
  judgment: FullJudgment;
  bitJudge?: BitJudge;
  newSequenceJudgment?: NewSequenceJudgment;
  hasWon?: boolean;
  updating: boolean;
  bitDisplayWidthPx: number;
  displayWidth: number;
}

export function useBasePuzzle(props: PuzzleProps) {
  const displayMatrixRef = useRef<any>(null);
  const [state, setState] = useState<PuzzleState>(() => {
    const puzzle = props.puzzle;
    return {
      currentPuzzle: puzzle,
      guessText: puzzle.init || "",
      guessBits: puzzle.encoding ? puzzle.encoding.encodeText(puzzle.init || "") : BitSequence.empty(),
      winBits: puzzle.encoding ? puzzle.encoding.encodeText(puzzle.winText) : BitSequence.empty(),
      displayRows: [],
      judgment: new FullJudgment(false, BitSequence.empty(), []),
      hasWon: false,
      updating: false,
      bitDisplayWidthPx: props.bitDisplayWidthPx,
      displayWidth: 0,
    };
  });

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
      const newDisplayWidth = Math.floor(displayMatrixWidth / state.bitDisplayWidthPx);
      setState(s => ({ ...s, displayWidth: newDisplayWidth }));
    }
  }, [state.bitDisplayWidthPx]);

  useEffect(() => {
    updateDisplayWidth();
    window.addEventListener("resize", updateDisplayWidth);
    return () => window.removeEventListener("resize", updateDisplayWidth);
  }, [updateDisplayWidth]);

  // Judge setup
  const updateJudge = useCallback((puzzle: Puzzle) => {
    if (!puzzle.encoding) return;
    let judge: BinaryJudge | undefined;
    if (puzzle.encoding instanceof VariableWidthEncoder) {
      judge = puzzle.type === "Encode"
        ? new VariableWidthEncodingJudge(puzzle.encoding)
        : new VariableWidthDecodingJudge(puzzle.encoding);
    } else if (puzzle.encoding instanceof FixedWidthEncoder) {
      judge = puzzle.type === "Encode"
        ? new FixedWidthEncodingJudge(puzzle.encoding)
        : new FixedWidthDecodingJudge(puzzle.encoding);
    }
    setState(s => ({ ...s, judge }));
  }, []);

  // Update judgment
  const updateJudgment = useCallback(() => {
    const { currentPuzzle, judge, guessBits, winBits, bitJudge, newSequenceJudgment, guessText } = state;
    if (!currentPuzzle || !judge) return;
    const splitter = (bits: BitSequence) => currentPuzzle.encoding.splitForDisplay(bits, state.displayWidth);
    const newJudgment = judge.judgeBits(guessBits, winBits, splitter, bitJudge, newSequenceJudgment);
    if (newJudgment && !newJudgment.equals(state.judgment)) {
      setState(s => ({ ...s, judgment: newJudgment }));
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
  }, [state, props, displayMatrixRef]);

  // Update display rows
  const updateDisplayRows = useCallback(() => {
    const { currentPuzzle, displayWidth } = state;
    if (!currentPuzzle) return;
    const newDisplayRows: DisplayRow[] = [...currentPuzzle.encoding.splitForDisplay(state.guessBits, displayWidth)];
    setState(s => ({ ...s, displayRows: newDisplayRows }));
  }, [state]);

  // Update puzzle when prop changes
  useEffect(() => {
    setState(s => ({
      ...s,
      currentPuzzle: props.puzzle,
      displayRows: [],
      guessText: props.puzzle.init || "",
      guessBits: props.puzzle.encoding ? props.puzzle.encoding.encodeText(props.puzzle.init || "") : BitSequence.empty(),
      judgment: new FullJudgment(false, BitSequence.empty(), []),
      winBits: props.puzzle.encoding ? props.puzzle.encoding.encodeText(props.puzzle.winText) : BitSequence.empty(),
    }));
    updateJudge(props.puzzle);
  }, [props.puzzle, updateJudge]);

  // Update judgment when relevant state changes
  useEffect(() => {
    updateJudgment();
  }, [state.currentPuzzle, state.guessText, state.guessBits, state.winBits, state.judge]);

  return {
    state,
    setState,
    displayMatrixRef,
    updateJudgment,
    updateDisplayRows,
  };
}

