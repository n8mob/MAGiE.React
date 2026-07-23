import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ReactGA4 from "react-ga4";
import { CorrectnessBitButton } from "./BitButton.tsx";
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
// Where the fixed judgment line sits, as a fraction of the belt height below the
// HUD. A row is judged only once its BOTTOM edge rises past this line, so a row
// still touching it is fair game. Tune by eye.
const LINE_POSITION = 0.2;
// How much the "cue" (fast-forward) button multiplies belt speed while held.
const CUE_SPEED_MULTIPLIER = 12;
// Space is 0 (all bits off) in 5bA1, so both the target and the decoded guess
// can legitimately be a space — invisible in either slot. Stand one in so an
// untouched row reads as "nothing here yet" rather than as a rendering bug.
const SPACE_GLYPH = "_";

/** Render a character that would otherwise be invisible. */
const visibleChar = (char: string) => (char === " " || char === "" ? SPACE_GLYPH : char);

/**
 * Clocks that hide the target letter in the left gutter.
 *
 * Empty for alpha: every mode shows what the player is aiming for. For beta,
 * add "scroll" here to hide it in Dessert — a visible target beside a live
 * decode lets a player match glyphs without doing the encoding mentally, which
 * is fine while teaching and not fine while testing.
 */
const HIDE_TARGET_GUTTER_FOR: string[] = [];

const showsTargetGutter = (clock: string) => !HIDE_TARGET_GUTTER_FOR.includes(clock);

type RunState = "running" | "won" | "lost";

/**
 * Keys that hold the conveyor in fast-forward. F and Space are the real
 * controls; the Media* names are spec'd KeyboardEvent.key values for keyboards
 * with transport controls — most OSes swallow those before the browser sees
 * them, so they're a free bonus, never something to rely on.
 */
const isCueKey = (key: string) =>
  key === "f" || key === "F" || key === " "
  || key === "MediaFastForward" || key === "MediaTrackNext";

/**
 * Chocolate mode: the full target text is shown, one letter per row, and every
 * bit starts off. The player toggles bits; a letter lights teal only when its
 * whole row is right (PerLetterJudge — no bit-level feedback).
 *
 * Clocks: "none" (Taste, player-paced), "advance" (Treat, focus auto-advances,
 * timed), "scroll" (Dessert, a continuous conveyor carries the message up past a
 * fixed judgment line; each letter scores a point or a strike as it crosses).
 *
 * Dessert scrolling: the belt is translated smoothly every animation frame; the
 * continuous offset `s` (in rows) is the single source of truth. The count of
 * judged rows is derived as floor(s + judgeOffset) — when that integer ticks up,
 * the rows that just finished crossing the line are scored and locked.
 */
const ChocolateMode: FC<PuzzleProps> = ({ puzzle, onWin = () => {} }) => {
  const clock = puzzle.clock ?? "scroll";
  const scrollSpeed = puzzle.scrollSpeed ?? 0.20;
  const scrollAccel = puzzle.scrollAccel ?? 0.04;
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
  // Count of rows that have finished crossing the line: judged, scored, locked.
  const [scrolledRows, setScrolledRows] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [points, setPoints] = useState(0);
  // One entry per scrolled-off (or completed) letter. Kept whole for the
  // future "gleaned message" narrative hook — do not collapse to a count.
  const [letterResults, setLetterResults] = useState<boolean[]>([]);
  // Empty conveyor-belt rows above the message: the runway, so the first letter
  // starts near the bottom of the belt and rides up to the line. Set at measure.
  const [spacerCount, setSpacerCount] = useState(0);
  // Painted judgment line, in px from the top of #main-display. Set at measure.
  const [lineTopPx, setLineTopPx] = useState(0);
  // Gate: true once the belt has been measured. Wakes the animation loop (state,
  // not a ref, precisely so it can) and reveals the line.
  const [measured, setMeasured] = useState(false);
  const winReported = useRef(false);
  const displayMatrixRef = useRef<DisplayMatrixUpdate>(null);
  const mainDisplayRef = useRef<HTMLDivElement>(null);
  const rowPitchRef = useRef(32);
  // judgedCount = floor(s + judgeOffset). Folds in the line depth and the runway
  // so that at s = 0 nothing is judged. Constant once measured.
  const judgeOffsetRef = useRef(0);
  // The continuous scroll offset, in rows. The one true position of the belt.
  const sRef = useRef(0);
  // "Cue" fast-forward: held state read by the animation loop (ref, instant) and
  // mirrored to state for button styling / the future VHS overlay.
  const cueHeldRef = useRef(false);
  const [cueActive, setCueActive] = useState(false);
  // Mirror of scrolledRows for the animation loop to read without re-subscribing.
  const scrolledRowsRef = useRef(0);
  // Set by input handlers so the view follows the cursor only when the player
  // moved it — never in Dessert, where the belt owns the view.
  const shouldFollowCursor = useRef(false);

  const judge = useMemo(() => new PerLetterJudge(encoding), [encoding]);
  const judgment = useMemo(
    () => judge.judgeBits(guessBits, winBits, (bits) => encoding.splitByChar(bits)),
    [judge, guessBits, winBits, encoding]
  );
  // The conveyor loop reads judgment through a ref so bit toggles don't reset it.
  const judgmentRef = useRef(judgment);
  useEffect(() => {
    judgmentRef.current = judgment;
  }, [judgment]);

  useEffect(() => {
    scrolledRowsRef.current = scrolledRows;
  }, [scrolledRows]);

  // One row per letter. The annotation is simply what the player's bits decode
  // to right now — the target letter lives in the left gutter, so the two never
  // occupy the same slot and neither needs marking up to say which it is.
  const displayRows = useMemo(() => {
    const rows: DisplayRow[] = [];
    let letterIndex = 0;
    for (const letterBits of encoding.splitByChar(guessBits)) {
      const decoded = encoding.decodeChar(letterBits);
      // A decoded space only needs standing in for when it's wrong. Space is the
      // sole character encoding to 0, so a decoded space matching a target space
      // is necessarily correct — show it as the real (invisible) space. Where the
      // target is a letter, the underscore says "you've left this blank", and
      // .letter-incorrect colours it purple.
      const annotation = decoded === " " && targetChars[letterIndex] !== " "
        ? SPACE_GLYPH
        : decoded;
      rows.push(new DisplayRow(letterBits, annotation));
      letterIndex++;
    }
    return rows;
  }, [encoding, guessBits, targetChars]);

  const rowCount = displayRows.length;
  const rowWidth = rowCount > 0 ? displayRows[0].length : 1;

  // Measure the belt once, then place the runway and the line. Runs before paint
  // (and setState here re-renders before paint) so no unspaced frame is shown.
  useLayoutEffect(() => {
    if (clock !== "scroll" || measured || rowCount === 0) {
      return;
    }
    const container = mainDisplayRef.current;
    const firstRow = displayMatrixRef.current?.getBitRowElement?.(0);
    if (!container || !firstRow) {
      return;
    }
    const secondRow = displayMatrixRef.current?.getBitRowElement?.(1);
    const pitch = Math.max(
      secondRow
        ? secondRow.getBoundingClientRect().top - firstRow.getBoundingClientRect().top
        : firstRow.offsetHeight,
      1
    );
    const containerTop = container.getBoundingClientRect().top;
    // The belt's content origin, measured — not assumed to equal hudHeight, since
    // padding/margins above the first row shift it.
    const beltTopPx = firstRow.getBoundingClientRect().top - containerTop;
    const hudHeight = container.querySelector<HTMLElement>(".chocolate-hud")?.offsetHeight ?? 0;
    const conveyorVisibleHeight = Math.max(container.clientHeight - hudHeight, pitch);
    const beltRows = conveyorVisibleHeight / pitch;
    // Enough empty rows that the first letter starts at the bottom of the belt.
    const runway = Math.max(1, Math.ceil(beltRows * 0.74));
    const lineTopPx = hudHeight + LINE_POSITION * conveyorVisibleHeight;
    rowPitchRef.current = pitch;
    // Runway rows must be exactly one pitch tall, or the uniform-pitch transform
    // model drifts by runway * (pitch - spacerHeight). Feed the measured pitch to
    // the spacer CSS so message rows land where the formula expects.
    container.style.setProperty("--chocolate-row-pitch", `${pitch}px`);
    // Scoring threshold and painted line share the same measured pixels, so a
    // letter locks exactly as its bottom edge clears the line.
    // judgedCount = floor(s + judgeOffset); row m judged when its bottom (at
    // rendered row m+runway) reaches lineTopPx.
    judgeOffsetRef.current = (lineTopPx - beltTopPx) / pitch - runway;
    setSpacerCount(runway);
    setLineTopPx(lineTopPx);
    setMeasured(true);
  }, [clock, measured, rowCount]);

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

  // Score and lock the rows that just finished crossing the line, [from, judged).
  const commitCrossings = useCallback((judged: number) => {
    const from = scrolledRowsRef.current;
    if (judged <= from) {
      return;
    }
    const results: boolean[] = [];
    let correctCount = 0;
    for (let r = from; r < judged; r++) {
      const correct = judgmentRef.current.sequenceJudgments[r]?.isSequenceCorrect ?? false;
      results.push(correct);
      if (correct) {
        correctCount++;
      }
    }
    const strikeCount = (judged - from) - correctCount;
    scrolledRowsRef.current = judged;
    setScrolledRows(judged);
    if (correctCount > 0) {
      setPoints(p => p + correctCount);
    }
    if (strikeCount > 0) {
      setStrikes(s => s + strikeCount);
    }
    setLetterResults(prev => [...prev, ...results]);
  }, []);

  // The Dessert conveyor: translate the belt continuously, deriving the discrete
  // judged count from the position each frame. React stays out of the 60fps loop
  // — setState fires (via commitCrossings) only when a row actually crosses.
  useEffect(() => {
    if (clock !== "scroll" || runState !== "running" || !measured || rowCount === 0) {
      return;
    }
    const belt = displayMatrixRef.current?.getBitFieldElement?.();
    if (!belt) {
      return;
    }
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      // Clamp dt so a backgrounded tab doesn't leap the belt forward on return.
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const tier = Math.floor(scrolledRowsRef.current / ACCEL_EVERY_ROWS);
      const speed = Math.max(scrollSpeed + scrollAccel * tier, MIN_SCROLL_SPEED);
      // "Cue": a momentary boost while the fast-forward button is held. Read from
      // a ref so the loop needn't re-subscribe when it toggles.
      const cueBoost = cueHeldRef.current ? CUE_SPEED_MULTIPLIER : 1;
      sRef.current += dt * speed * cueBoost;
      belt.style.transform = `translate3d(0, ${-sRef.current * rowPitchRef.current}px, 0)`;
      const judged = Math.max(0, Math.min(rowCount, Math.floor(sRef.current + judgeOffsetRef.current)));
      if (judged > scrolledRowsRef.current) {
        commitCrossings(judged);
      }
      if (scrolledRowsRef.current >= rowCount) {
        return; // Everything judged; the run-outcome effect closes it out.
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [clock, runState, measured, rowCount, scrollSpeed, scrollAccel, commitCrossings]);

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
    shouldFollowCursor.current = true;
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
    shouldFollowCursor.current = true;
    setCursor(index);
  }, [runState, cursor, winBits.length, minEditableBit, isRowLocked, rowOf, rowWidth]);

  const handleBitToggle = useCallback((index: number) => {
    if (runState !== "running") {
      return;
    }
    if (index < minEditableBit || isRowLocked(rowOf(index))) {
      return;
    }
    setGuessBits(prev => prev.toggleBit(index));
    shouldFollowCursor.current = true;
    setCursor(index + 1);
  }, [runState, minEditableBit, isRowLocked, rowOf]);

  // Cue (fast-forward) held only while the button/key is down and the run is live.
  const startCue = useCallback(() => {
    if (runState !== "running") {
      return;
    }
    cueHeldRef.current = true;
    setCueActive(true);
  }, [runState]);
  const stopCue = useCallback(() => {
    cueHeldRef.current = false;
    setCueActive(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (runState !== "running") {
        return;
      }
      if (isCueKey(event.key)) {
        // Space would scroll (and re-trigger a focused button); keydown repeats
        // while held, and startCue is idempotent, so repeats are harmless.
        event.preventDefault();
        startCue();
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
    // Releasing is deliberately not gated on runState: a run ending mid-hold
    // must still let go of the cue. Blur covers alt-tabbing away while held,
    // where the keyup never arrives.
    const handleKeyUp = (event: KeyboardEvent) => {
      if (isCueKey(event.key)) {
        stopCue();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", stopCue);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", stopCue);
    };
  }, [runState, typeBit, deleteBit, minEditableBit, winBits.length, rowWidth, startCue, stopCue]);

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
      // The hop is a consequence of the player completing a letter. In Dessert
      // the belt owns the view, so let it follow only in the timed Treat mode.
      shouldFollowCursor.current = clock === "advance";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCursor(Math.max(next * rowWidth, minEditableBit));
    }
  }, [runState, clock, cursor, rowOf, rowCount, isRowCorrect, rowWidth, minEditableBit]);

  // Keep the cursor on the conveyor when rows lock beneath it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCursor(c => Math.max(c, minEditableBit));
  }, [minEditableBit]);

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
        if (remaining > 0) {
          setPoints(p => p + remaining);
          setLetterResults(prev => [...prev, ...new Array(remaining).fill(true)]);
          setScrolledRows(rowCount);
        }
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
    scrolledRowsRef.current = 0;
    setStrikes(0);
    setPoints(0);
    setLetterResults([]);
    winReported.current = false;
    // Release the cue in case a hold was interrupted by the run ending.
    cueHeldRef.current = false;
    setCueActive(false);
    // Rewind the belt to the start; the animation loop restarts when runState
    // returns to "running".
    sRef.current = 0;
    const belt = displayMatrixRef.current?.getBitFieldElement?.();
    if (belt) {
      belt.style.transform = "translate3d(0, 0, 0)";
    }
    setRunState("running");
  }, [allOffBits]);

  const focusedRow = rowOf(Math.min(cursor, Math.max(winBits.length - 1, 0)));

  // Step the focused row into view when the player moved the cursor — but never
  // in Dessert, where the belt owns the view. The no-deps effect clears any
  // leftover flag every render so a stale flag can't fire on a later tick.
  useEffect(() => {
    const follow = shouldFollowCursor.current;
    shouldFollowCursor.current = false;
    if (!follow || clock === "scroll") {
      return;
    }
    const rowElement = displayMatrixRef.current?.getBitRowElement?.(focusedRow + spacerCount);
    rowElement?.scrollIntoView({ block: "nearest" });
  });

  // Rendered rows: the empty runway, then the whole message. Judged rows stay on
  // screen (locked) and ride up behind the HUD.
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

  // Left gutter: the target letter for this row. Runway rows have no target.
  const renderTarget = useCallback((renderedRowIndex: number) => {
    if (renderedRowIndex < spacerCount) {
      return "";
    }
    return visibleChar(targetChars[renderedRowIndex - spacerCount] ?? "");
  }, [spacerCount, targetChars]);

  if (!puzzle) {
    // No crashes!
    return <></>;
  }

  return (
    <div id="game-content">
      <div
        id="main-display"
        className={`display chocolate-display${clock === "scroll" ? " conveyor-locked" : ""}`}
        ref={mainDisplayRef}
        // Covers the HUD too, which sits outside the bit grid's own handler.
        onContextMenu={event => event.preventDefault()}
      >
        {clock === "scroll" && (
          <div className="chocolate-hud">
            <span>SCORE {points}</span>
            {runState === "running" && (
              <button
                type="button"
                className={`chocolate-cue${cueActive ? " active" : ""}`}
                aria-label="Fast forward — hold F or Space"
                title="Hold to fast forward (F or Space)"
                // Pointer capture keeps the hold alive if the finger drifts off
                // the button; release/cancel/lost-capture all end it.
                onPointerDown={event => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  startCue();
                }}
                onPointerUp={stopCue}
                onPointerCancel={stopCue}
                onLostPointerCapture={stopCue}
                // Long-press fires contextmenu on Android/desktop; suppress it so
                // the hold isn't interrupted by a menu.
                onContextMenu={event => event.preventDefault()}
              >
                ▶▶
              </button>
            )}
            <span>STRIKES {strikes}/{maxStrikes}</span>
          </div>
        )}
        {clock === "scroll" && measured && (
          <div className="chocolate-judgment-line" style={{ top: lineTopPx }} aria-hidden="true" />
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
            renderGutter={showsTargetGutter(clock) ? renderTarget : undefined}
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
      {runState === "won" && (
        <div id="puzzle-inputs">
          <div id="win-message" className="display">
            {clock === "scroll" && <p>SCORE {points}</p>}
            {[...(puzzle.winMessage ?? [])].map((winLine, winIndex) =>
              <p key={`win-message-${winIndex}`}>{winLine}</p>)}
          </div>
        </div>
      )}
    </div>
  );
};

export { ChocolateMode };
