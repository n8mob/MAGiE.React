import { ChangeEvent, FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactGA4 from "react-ga4";
import { CorrectnessBitButton } from "./BitButton.tsx";
import { BitInputs } from "./BitInputs.tsx";
import { PuzzleProps } from "./useBasePuzzle";
import { DisplayMatrix, DisplayMatrixUpdate } from "./DisplayMatrix";
import { BitSequence } from "../BitSequence.ts";
import { Correctness } from "../judgment/BitJudgment.ts";
import { PerLetterJudge } from "../judgment/PerLetterJudge.ts";
import { DisplayRow } from "../encoding/DisplayRow.ts";
import { chocolateEncoding } from "../encoding/FiveBitA1.ts";
import "./Chocolate.css";

// The conveyor speeds up by scrollAccel rows/sec each time this many rows scroll off.
const ACCEL_EVERY_ROWS = 10;
const MIN_SCROLL_SPEED = 0.05;

type RunState = "running" | "won" | "lost";

/**
 * Chocolate mode: the full target text is shown, one letter per row, and every
 * bit starts off. The player toggles bits; a letter lights teal only when its
 * whole row is right (PerLetterJudge — no bit-level feedback).
 *
 * Clocks: "none" (Taste, player-paced), "advance" (Treat, focus auto-advances,
 * timed), "scroll" (Dessert, the conveyor removes the top row on a timer;
 * correct rows score a point, incorrect rows a strike).
 */
const ChocolateMode: FC<PuzzleProps> = ({ puzzle, onWin = () => {} }) => {
  const clock = puzzle.clock ?? "scroll";
  const scrollSpeed = puzzle.scrollSpeed ?? 0.15;
  const scrollAccel = puzzle.scrollAccel ?? 0.05;
  const maxStrikes = puzzle.maxStrikes ?? 10;

  // PlayPuzzle already substitutes 5bA1 for non-fixed-width encodings; resolving
  // again here keeps the mode safe no matter how it's reached.
  const encoding = useMemo(() => chocolateEncoding(puzzle.encoding), [puzzle]);

  // Existing Encode/Decode puzzles double as chocolate content: clue + winText.
  const chocolateText = useMemo(() => {
    return [...(puzzle.clue ?? []), puzzle.winText ?? ""]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }, [puzzle]);

  const targetChars = useMemo(() => [...chocolateText], [chocolateText]);
  const winBits = useMemo(() => encoding.encodeText(chocolateText), [encoding, chocolateText]);
  const allOffBits = useCallback(
    () => BitSequence.fromString("0".repeat(winBits.length)),
    [winBits.length]
  );

  const [guessBits, setGuessBits] = useState<BitSequence>(allOffBits);
  const [runState, setRunState] = useState<RunState>("running");
  const [cursor, setCursor] = useState(0);
  const [scrolledRows, setScrolledRows] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [points, setPoints] = useState(0);
  // One entry per scrolled-off (or completed) letter. Kept whole for the
  // future "gleaned message" narrative hook — do not collapse to a count.
  const [letterResults, setLetterResults] = useState<boolean[]>([]);
  const winReported = useRef(false);
  const displayMatrixRef = useRef<DisplayMatrixUpdate>(null);

  const judge = useMemo(() => new PerLetterJudge(encoding), [encoding]);
  const judgment = useMemo(
    () => judge.judgeBits(guessBits, winBits, (bits) => encoding.splitByChar(bits)),
    [judge, guessBits, winBits, encoding]
  );
  // The conveyor timer reads judgment through a ref so bit toggles don't reset the tick.
  const judgmentRef = useRef(judgment);
  useEffect(() => {
    judgmentRef.current = judgment;
  }, [judgment]);

  // One row per letter, annotated with the letter to be encoded.
  const displayRows = useMemo(() => {
    const rows: DisplayRow[] = [];
    let letterIndex = 0;
    for (const letterBits of encoding.splitByChar(guessBits)) {
      rows.push(new DisplayRow(letterBits, targetChars[letterIndex] ?? ""));
      letterIndex++;
    }
    return rows;
  }, [encoding, guessBits, targetChars]);

  const rowCount = displayRows.length;
  const rowWidth = rowCount > 0 ? displayRows[0].length : 1;

  const rowOf = useCallback((bitIndex: number) => Math.floor(bitIndex / rowWidth), [rowWidth]);
  const isRowCorrect = useCallback(
    (row: number) => judgment.sequenceJudgments[row]?.isSequenceCorrect ?? false,
    [judgment]
  );
  // Dessert locks correct letters so the conveyor can't shake them loose.
  const isRowLocked = useCallback(
    (row: number) => clock === "scroll" && isRowCorrect(row),
    [clock, isRowCorrect]
  );
  const minEditableBit = clock === "scroll" ? scrolledRows * rowWidth : 0;

  const nextEditableBit = useCallback((fromBit: number) => {
    let index = Math.max(fromBit, minEditableBit);
    while (index < winBits.length && isRowLocked(rowOf(index))) {
      index = (rowOf(index) + 1) * rowWidth;
    }
    return index;
  }, [minEditableBit, winBits.length, isRowLocked, rowOf, rowWidth]);

  const typeBit = useCallback((bit: "0" | "1") => {
    if (runState !== "running") {
      return;
    }
    const target = nextEditableBit(cursor);
    if (target >= winBits.length) {
      return;
    }
    setGuessBits(prev => prev.getBit(target).bit === bit ? prev : prev.toggleBit(target));
    setCursor(nextEditableBit(target + 1));
  }, [runState, cursor, nextEditableBit, winBits.length]);

  const deleteBit = useCallback(() => {
    if (runState !== "running") {
      return;
    }
    let index = Math.min(cursor, winBits.length) - 1;
    while (index >= minEditableBit && isRowLocked(rowOf(index))) {
      index = rowOf(index) * rowWidth - 1;
    }
    if (index < minEditableBit) {
      return;
    }
    setGuessBits(prev => prev.getBit(index).bit === "0" ? prev : prev.toggleBit(index));
    setCursor(index);
  }, [runState, cursor, winBits.length, minEditableBit, isRowLocked, rowOf, rowWidth]);

  const handleBitClick = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (runState !== "running") {
      return;
    }
    const bitIndex = event.target.dataset.bitIndex;
    if (bitIndex === undefined) {
      return;
    }
    const index = parseInt(bitIndex);
    if (index < minEditableBit || isRowLocked(rowOf(index))) {
      return;
    }
    setGuessBits(prev => prev.toggleBit(index));
    setCursor(index + 1);
  }, [runState, minEditableBit, isRowLocked, rowOf]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (runState !== "running") {
        return;
      }
      switch (event.key) {
        case "0":
        case "1":
          typeBit(event.key);
          break;
        case "Backspace":
          deleteBit();
          break;
        case "ArrowLeft":
          setCursor(c => Math.max(c - 1, minEditableBit));
          break;
        case "ArrowRight":
          setCursor(c => Math.min(c + 1, winBits.length));
          break;
        case "ArrowUp":
          setCursor(c => Math.max(c - rowWidth, minEditableBit));
          break;
        case "ArrowDown":
          setCursor(c => Math.min(c + rowWidth, winBits.length));
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runState, typeBit, deleteBit, minEditableBit, winBits.length, rowWidth]);

  // Treat/Dessert: once the focused letter is correct, hop to the next
  // not-yet-correct row (this also skips the free space rows).
  useEffect(() => {
    if (runState !== "running" || clock === "none") {
      return;
    }
    const row = rowOf(cursor);
    if (row < rowCount && isRowCorrect(row)) {
      let next = row + 1;
      while (next < rowCount && isRowCorrect(next)) {
        next++;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCursor(Math.max(next * rowWidth, minEditableBit));
    }
  }, [runState, clock, cursor, rowOf, rowCount, isRowCorrect, rowWidth, minEditableBit]);

  // Keep the cursor on the conveyor when rows scroll off beneath it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCursor(c => Math.max(c, minEditableBit));
  }, [minEditableBit]);

  // The Dessert conveyor: one whole-row step per tick — discrete, like the
  // original hardware would. The row leaving the top edge is judged as it goes.
  useEffect(() => {
    if (clock !== "scroll" || runState !== "running" || rowCount === 0 || scrolledRows >= rowCount) {
      return;
    }
    const speed = Math.max(
      scrollSpeed + scrollAccel * Math.floor(scrolledRows / ACCEL_EVERY_ROWS),
      MIN_SCROLL_SPEED
    );
    const timeout = window.setTimeout(() => {
      const correct = judgmentRef.current.sequenceJudgments[scrolledRows]?.isSequenceCorrect ?? false;
      setLetterResults(prev => [...prev, correct]);
      if (correct) {
        setPoints(p => p + 1);
      } else {
        setStrikes(s => s + 1);
      }
      setScrolledRows(r => r + 1);
    }, 1000 / speed);
    return () => window.clearTimeout(timeout);
  }, [clock, runState, scrolledRows, rowCount, scrollSpeed, scrollAccel]);

  // Run outcomes, in priority order: strike-out, full completion, survival.
  useEffect(() => {
    if (runState !== "running" || rowCount === 0) {
      return;
    }
    if (clock === "scroll" && strikes >= maxStrikes) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRunState("lost");
      ReactGA4.event("chocolate_strike_out", {
        puzzle_slug: puzzle.slug,
        points: points,
        strikes: strikes,
        letters_total: rowCount,
      });
      return;
    }
    if (judgment.isCorrect) {
      if (clock === "scroll") {
        // Outran the conveyor: the untouched remainder scores as correct.
        const remaining = rowCount - scrolledRows;
        setPoints(p => p + remaining);
        setLetterResults(prev => [...prev, ...new Array(remaining).fill(true)]);
        setScrolledRows(rowCount);
      }
      setRunState("won");
      return;
    }
    if (clock === "scroll" && scrolledRows >= rowCount) {
      setRunState("won");
    }
  }, [runState, clock, strikes, maxStrikes, judgment, rowCount, scrolledRows, points, puzzle]);

  useEffect(() => {
    if (runState === "won" && !winReported.current) {
      winReported.current = true;
      onWin();
    }
  }, [runState, onWin]);

  const handleRetry = useCallback(() => {
    setGuessBits(allOffBits());
    setCursor(0);
    setScrolledRows(0);
    setStrikes(0);
    setPoints(0);
    setLetterResults([]);
    setRunState("running");
  }, [allOffBits]);

  const focusedRow = rowOf(Math.min(cursor, Math.max(winBits.length - 1, 0)));

  // Step the focused row into view (discrete, no smooth scrolling).
  useEffect(() => {
    const rowElement = displayMatrixRef.current?.getBitRowElement?.(focusedRow - scrolledRows);
    rowElement?.scrollIntoView({ block: "nearest" });
  }, [focusedRow, scrolledRows]);

  const visibleRows = useMemo(() => displayRows.slice(scrolledRows), [displayRows, scrolledRows]);

  const rowClassName = useCallback((visibleRowIndex: number) => {
    const absoluteRow = visibleRowIndex + scrolledRows;
    const classes = [isRowCorrect(absoluteRow) ? "letter-correct" : "letter-incorrect"];
    if (runState === "running" && absoluteRow === focusedRow) {
      classes.push("focused-row");
    }
    return classes.join(" ");
  }, [scrolledRows, isRowCorrect, runState, focusedRow]);

  if (!puzzle) {
    // No crashes!
    return <></>;
  }

  return (
    <div id="game-content">
      <div id="main-display" className="display chocolate-display">
        {clock === "scroll" && (
          <div className="chocolate-hud">
            <span>SCORE {points}</span>
            <span>STRIKES {strikes}/{maxStrikes}</span>
          </div>
        )}
        {runState === "lost" ? (
          <div className="chocolate-game-over">
            <p>The conveyor got ahead of you!</p>
            <p>SCORE {points}</p>
            <p>LETTERS GLEANED {letterResults.filter(Boolean).length}/{rowCount}</p>
            <button type="button" onClick={handleRetry}>TRY AGAIN</button>
          </div>
        ) : (
          <DisplayMatrix
            ref={displayMatrixRef}
            displayRows={visibleRows}
            showAnnotations={true}
            rowClassName={rowClassName}
            renderBit={(bit, rowIndex) => (
              <CorrectnessBitButton
                key={`bit-${bit.index}`}
                bit={bit}
                correctness={isRowCorrect(rowIndex + scrolledRows)
                  ? Correctness.correct
                  : Correctness.incorrect}
                onChange={handleBitClick}
              />
            )}
          />
        )}
      </div>
      <div id="puzzle-inputs">
        {runState === "won" ? (
          <div id="win-message" className="display">
            {clock === "scroll" && <p>SCORE {points}</p>}
            {[...(puzzle.winMessage ?? [])].map((winLine, winIndex) =>
              <p key={`win-message-${winIndex}`}>{winLine}</p>)}
          </div>
        ) : (
          <BitInputs
            onBit={typeBit}
            onDelete={deleteBit}
            onSubmit={() => {}}
            disabled={runState !== "running"}
          />
        )}
      </div>
    </div>
  );
};

export { ChocolateMode };
