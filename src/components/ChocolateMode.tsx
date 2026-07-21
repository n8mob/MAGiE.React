import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { useBitSounds } from "../hooks/useBitSounds.ts";
import "./Chocolate.css";

// The conveyor speeds up by scrollAccel rows/sec each time this many rows scroll off.
const ACCEL_EVERY_ROWS = 10;
const MIN_SCROLL_SPEED = 0.05;
// How long after the last edit a wrong row keeps showing the target letter
// before revealing what the player's bits actually encode.
const GUESS_REVEAL_MS = 800;

type RunState = "running" | "won" | "lost";

/**
 * Chocolate mode: the full target text is shown, one letter per row, and every
 * bit starts off. The player toggles bits; a letter lights teal only when its
 * whole row is right (PerLetterJudge — no bit-level feedback).
 *
 * Clocks: "none" (Taste, player-paced), "advance" (Treat, focus auto-advances,
 * timed), "scroll" (Dessert, a judged edge sweeps down the message on a timer,
 * locking rows as it passes; correct rows score a point, incorrect a strike).
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
  useBitSounds(guessBits);
  const [runState, setRunState] = useState<RunState>("running");
  const [cursor, setCursor] = useState(0);
  const [scrolledRows, setScrolledRows] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [points, setPoints] = useState(0);
  // One entry per scrolled-off (or completed) letter. Kept whole for the
  // future "gleaned message" narrative hook — do not collapse to a count.
  const [letterResults, setLetterResults] = useState<boolean[]>([]);
  // Empty conveyor-belt rows above the message, so the first letter starts at
  // the bottom of the display (Dessert), half-way up (Treat), or at the top
  // (Taste). leadInSize is the static spacer count; leadIn counts down as the
  // judged edge descends through the empty belt. null until measured.
  const [leadIn, setLeadIn] = useState<number | null>(null);
  const [leadInSize, setLeadInSize] = useState<number | null>(null);
  // Topmost rendered row currently in the viewport, tracked from scroll events,
  // for placing the judged-edge marker.
  const [topVisibleRow, setTopVisibleRow] = useState(0);
  // Wrong rows whose reveal delay has passed: their annotation shows the
  // character the player's bits actually encode instead of the target.
  const [revealedRows, setRevealedRows] = useState<ReadonlySet<number>>(new Set());
  const lastEditAtRef = useRef<Record<number, number>>({});
  const revealTimeoutsRef = useRef<number[]>([]);
  const winReported = useRef(false);
  const displayMatrixRef = useRef<DisplayMatrixUpdate>(null);
  const mainDisplayRef = useRef<HTMLDivElement>(null);
  const rowPitchRef = useRef(32);
  const rowsThatFitRef = useRef(1);
  const bufferRowsRef = useRef(1);
  // Offset from the container's content top to the first rendered row (the HUD
  // sits above the rows), captured at measurement time.
  const rowsTopOffsetRef = useRef(0);
  // The sticky HUD overlays the top rows once scrolled; the marker must sit on
  // the first row fully visible below it, not merely inside the viewport.
  const hudHeightRef = useRef(0);
  // Set by input handlers so the view follows the cursor only when the player
  // moved it — never when the belt did.
  const shouldFollowCursor = useRef(false);

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

  // One row per letter. The annotation shows the target ("win") character by
  // default; a wrong row that has sat unedited past the reveal delay — or that
  // the judged edge has already passed — shows the character the player's bits
  // actually encode (the "guess" character) instead. Correct rows show the
  // letter either way, since guess == target. Row coloring is unchanged: the
  // annotation and bits always color together, per whole-letter judgment.
  const displayRows = useMemo(() => {
    const rows: DisplayRow[] = [];
    let letterIndex = 0;
    for (const letterBits of encoding.splitByChar(guessBits)) {
      const isCorrect = judgment.sequenceJudgments[letterIndex]?.isSequenceCorrect ?? false;
      const judged = clock === "scroll" && letterIndex < scrolledRows;
      const revealGuess = !isCorrect && (judged || revealedRows.has(letterIndex));
      const annotation = revealGuess
        ? encoding.decodeChar(letterBits)
        : (targetChars[letterIndex] ?? "");
      rows.push(new DisplayRow(letterBits, annotation));
      letterIndex++;
    }
    return rows;
  }, [encoding, guessBits, targetChars, judgment, clock, scrolledRows, revealedRows]);

  const rowCount = displayRows.length;
  const rowWidth = rowCount > 0 ? displayRows[0].length : 1;

  // Measure how many rows fit the display, then set the lead-in per clock:
  // Dessert starts the first letter at the bottom edge, Treat half-way, Taste
  // at the top. Runs once per run (leadIn resets to null on retry).
  useEffect(() => {
    if (leadIn !== null || rowCount === 0) {
      return;
    }
    const container = mainDisplayRef.current;
    const firstRow = displayMatrixRef.current?.getBitRowElement?.(0);
    if (!container || !firstRow) {
       
      setLeadIn(0);
      return;
    }
    const secondRow = displayMatrixRef.current?.getBitRowElement?.(1);
    const rowPitch = secondRow
      ? secondRow.getBoundingClientRect().top - firstRow.getBoundingClientRect().top
      : firstRow.offsetHeight;
    rowPitchRef.current = Math.max(rowPitch, 1);
    rowsTopOffsetRef.current = firstRow.getBoundingClientRect().top
      - container.getBoundingClientRect().top + container.scrollTop;
    hudHeightRef.current = container.querySelector<HTMLElement>(".chocolate-hud")?.offsetHeight ?? 0;
    const rowsThatFit = Math.max(1, Math.floor(container.clientHeight / Math.max(rowPitch, 1)));
    rowsThatFitRef.current = rowsThatFit;
    // The scroll edge trails the judged edge by ~70% of a screenful, capped at 7.
    bufferRowsRef.current = Math.max(1, Math.min(7, Math.round(rowsThatFit * 0.7)));
    const startRow = clock === "scroll" ? rowsThatFit - 1
      : clock === "advance" ? Math.floor(rowsThatFit / 2)
      : 0;

    setLeadIn(Math.max(0, startRow));
    setLeadInSize(Math.max(0, startRow));
  }, [leadIn, rowCount, clock]);

  const spacerCount = leadInSize ?? 0;

  // The judged edge as a rendered-row index: it descends through the empty
  // lead-in belt, then points at the next letter to be judged.
  const pointerIndex = useMemo(() => {
    if (clock !== "scroll" || leadIn === null || leadInSize === null) {
      return null;
    }
    return (leadInSize - leadIn) + scrolledRows;
  }, [clock, leadIn, leadInSize, scrolledRows]);

  // Auto-scroll: the scroll edge trails the judged edge by bufferRows. When it
  // would pass the bottom of the viewport, the view moves down — at most one
  // row per tick, so a player who scrolled back over judged rows is tugged
  // gently toward the action, while a player who scrolled ahead is left in
  // peace until the judged edge catches up.
  useLayoutEffect(() => {
    if (clock !== "scroll" || runState !== "running" || pointerIndex === null) {
      return;
    }
    const container = mainDisplayRef.current;
    if (!container) {
      return;
    }
    const pitch = rowPitchRef.current;
    const scrollEdge = pointerIndex + bufferRowsRef.current;
    const targetTop = rowsTopOffsetRef.current + (scrollEdge - rowsThatFitRef.current + 1) * pitch;
    if (targetTop > container.scrollTop) {
      container.scrollTop = Math.min(targetTop, container.scrollTop + pitch);
    }
  }, [clock, runState, pointerIndex]);

  // Track which rendered row is at the top of the viewport (for the marker).
  useEffect(() => {
    if (clock !== "scroll") {
      return;
    }
    const container = mainDisplayRef.current;
    if (!container) {
      return;
    }
    const updateTopVisibleRow = () => {
      const pitch = Math.max(rowPitchRef.current, 1);
      // First row fully visible below the sticky HUD (ceil: a row partially
      // scrolled out, or covered by the HUD, doesn't count as the top row).
      const firstFullyVisible = Math.ceil(
        (container.scrollTop + hudHeightRef.current - rowsTopOffsetRef.current) / pitch
      );
      setTopVisibleRow(Math.max(0, firstFullyVisible));
    };
     
    updateTopVisibleRow();
    container.addEventListener("scroll", updateTopVisibleRow, { passive: true });
    return () => container.removeEventListener("scroll", updateTopVisibleRow);
  }, [clock, runState]);

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

  // Record an edit to a row: the target letter comes back while the player is
  // working, and the guess character is revealed only after the delay passes
  // with no further edits to that row.
  const noteEdit = useCallback((bitIndex: number) => {
    const row = rowOf(bitIndex);
    const editedAt = Date.now();
    lastEditAtRef.current[row] = editedAt;
    setRevealedRows(prev => {
      if (!prev.has(row)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(row);
      return next;
    });
    const timeoutId = window.setTimeout(() => {
      if (lastEditAtRef.current[row] !== editedAt) {
        return; // A later edit restarted this row's reveal delay.
      }
      setRevealedRows(prev => {
        if (prev.has(row)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(row);
        return next;
      });
    }, GUESS_REVEAL_MS);
    revealTimeoutsRef.current.push(timeoutId);
  }, [rowOf]);

  useEffect(() => () => {
    revealTimeoutsRef.current.forEach(id => window.clearTimeout(id));
  }, []);

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
    noteEdit(target);
    shouldFollowCursor.current = true;
    setCursor(nextEditableBit(target + 1));
  }, [runState, cursor, nextEditableBit, winBits.length, noteEdit]);

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
    noteEdit(index);
    shouldFollowCursor.current = true;
    setCursor(index);
  }, [runState, cursor, winBits.length, minEditableBit, isRowLocked, rowOf, rowWidth, noteEdit]);

  const handleBitToggle = useCallback((index: number) => {
    if (runState !== "running") {
      return;
    }
    if (index < minEditableBit || isRowLocked(rowOf(index))) {
      return;
    }
    setGuessBits(prev => prev.toggleBit(index));
    noteEdit(index);
    shouldFollowCursor.current = true;
    setCursor(index + 1);
  }, [runState, minEditableBit, isRowLocked, rowOf, noteEdit]);

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
          shouldFollowCursor.current = true;
          setCursor(c => Math.max(c - 1, minEditableBit));
          break;
        case "ArrowRight":
          shouldFollowCursor.current = true;
          setCursor(c => Math.min(c + 1, winBits.length));
          break;
        case "ArrowUp":
          shouldFollowCursor.current = true;
          setCursor(c => Math.max(c - rowWidth, minEditableBit));
          break;
        case "ArrowDown":
          shouldFollowCursor.current = true;
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
      // The hop is a consequence of the player completing a letter, so the
      // view is allowed to follow it.
      shouldFollowCursor.current = true;
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
  // original hardware would. Rows are never removed; the judged edge sweeps
  // down the tape, locking each row as it passes.
  useEffect(() => {
    if (clock !== "scroll" || runState !== "running" || rowCount === 0 || scrolledRows >= rowCount
      || leadIn === null) {
      return;
    }
    const speed = Math.max(
      scrollSpeed + scrollAccel * Math.floor(scrolledRows / ACCEL_EVERY_ROWS),
      MIN_SCROLL_SPEED
    );
    const timeout = window.setTimeout(() => {
      // The empty lead-in belt scrolls off first; nothing to judge yet.
      if (leadIn > 0) {
        setLeadIn(l => (l ?? 1) - 1);
        return;
      }
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
  }, [clock, runState, scrolledRows, rowCount, scrollSpeed, scrollAccel, leadIn]);

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
    setLeadIn(null);
    setRevealedRows(new Set());
    lastEditAtRef.current = {};
    setRunState("running");
    if (mainDisplayRef.current) {
      mainDisplayRef.current.scrollTop = 0;
    }
  }, [allOffBits]);

  const focusedRow = rowOf(Math.min(cursor, Math.max(winBits.length - 1, 0)));

  // Step the focused row into view (discrete, no smooth scrolling) — but only
  // when the player moved the cursor. Belt ticks never steal the view; the
  // no-deps effect clears any leftover flag every render so a stale flag can't
  // fire on a later tick.
  useEffect(() => {
    const follow = shouldFollowCursor.current;
    shouldFollowCursor.current = false;
    if (!follow) {
      return;
    }
    const rowElement = displayMatrixRef.current?.getBitRowElement?.(focusedRow + spacerCount);
    rowElement?.scrollIntoView({ block: "nearest" });
  });

  // Rendered rows: the empty lead-in belt, then the whole message. Judged rows
  // stay on screen (locked) so the player can scroll back for reference.
  const renderedRows = useMemo(() => {
    const spacers = Array.from({ length: spacerCount }, () => new DisplayRow(BitSequence.empty(), ""));
    return [...spacers, ...displayRows];
  }, [spacerCount, displayRows]);

  const rowClassName = useCallback((renderedRowIndex: number) => {
    if (renderedRowIndex < spacerCount) {
      return "conveyor-spacer";
    }
    const letterRow = renderedRowIndex - spacerCount;
    const classes = [isRowCorrect(letterRow) ? "letter-correct" : "letter-incorrect"];
    if (runState === "running" && letterRow === focusedRow) {
      classes.push("focused-row");
    }
    return classes.join(" ");
  }, [spacerCount, isRowCorrect, runState, focusedRow]);

  // Judged-edge marker in the status gutter: ▶ on the next row to be judged,
  // or ▲ on the top visible row when the edge is above the viewport.
  const renderGutter = useCallback((renderedRowIndex: number) => {
    if (runState !== "running" || pointerIndex === null) {
      return "";
    }
    if (pointerIndex < topVisibleRow) {
      return renderedRowIndex === topVisibleRow ? "▲" : "";
    }
    return renderedRowIndex === pointerIndex ? "▶" : "";
  }, [runState, pointerIndex, topVisibleRow]);

  if (!puzzle) {
    // No crashes!
    return <></>;
  }

  return (
    <div id="game-content">
      <div id="main-display" className="display chocolate-display" ref={mainDisplayRef}>
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
            displayRows={renderedRows}
            showAnnotations={true}
            rowClassName={rowClassName}
            renderGutter={clock === "scroll" ? renderGutter : undefined}
            renderBit={(bit, rowIndex) => (
              <CorrectnessBitButton
                key={`bit-${bit.index}`}
                bit={bit}
                correctness={isRowCorrect(rowIndex - spacerCount)
                  ? Correctness.correct
                  : Correctness.incorrect}
                onBitToggle={handleBitToggle}
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
