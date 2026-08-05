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
import { useActivationGuard } from "../hooks/useActivationGuard.ts";
import { WinScreen } from "./WinScreen.tsx";
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
// Rewind: after the run, the belt runs backwards to bring the clue into view.
// Paced per row so short messages don't crawl and long ones don't drag, then
// bounded at both ends so it always reads as one deliberate movement.
const REWIND_MS_PER_ROW = 35;
const REWIND_MIN_MS = 320;
const REWIND_MAX_MS = 1100;
// Space is 0 (all bits off) in 5bA1, so both the target and the decoded guess
// can legitimately be a space — invisible in either slot. Stand one in so an
// untouched row reads as "nothing here yet" rather than as a rendering bug.
const SPACE_GLYPH = "_";

/** Render a character that would otherwise be invisible. */
const visibleChar = (char: string) => (char === " " || char === "" ? SPACE_GLYPH : char);

/**
 * Honour the OS "reduce motion" setting. The rewind is presentation, not
 * information — a player who has asked for less movement should simply arrive
 * at the clue. Guarded for environments without matchMedia (jsdom).
 */
const prefersReducedMotion = () =>
  typeof window.matchMedia === "function"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Ease in and out, so the belt starts and stops like a belt rather than a cut. */
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

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
interface ChocolateModeProps extends PuzzleProps {
  /** Chocolate is the only mode that can end in a loss. */
  onLose?: () => void;
  /** TRY AGAIN resets in place, so a new attempt has to announce itself. */
  onRetry?: () => void;
}

const ChocolateMode: FC<ChocolateModeProps> = ({
  puzzle,
  onWin = () => {},
  onLose = () => {},
  onRetry = () => {},
  winActions,
}) => {
  const clock = puzzle.clock ?? "scroll";
  const scrollSpeed = puzzle.scrollSpeed ?? 0.20;
  const scrollAccel = puzzle.scrollAccel ?? 0.04;
  const maxStrikes = puzzle.maxStrikes ?? 10;

  // PlayPuzzle already substitutes 5bA1 for non-fixed-width encodings; resolving
  // again here keeps the mode safe no matter how it's reached.
  const encoding = useMemo(() => chocolateEncoding(puzzle.encoding), [puzzle]);

  /*
   * The target text is the winText alone (#231).
   *
   * The clue used to be concatenated onto the front of it, which quietly assumed
   * every clue character had a code in the puzzle's encoding. 5bA1 covers A-Z, so
   * that held; hex covers only 0-9 and A-F, so every other letter in the clue
   * encodes to the default and becomes a row the player cannot possibly solve.
   * The clue is prose, not ciphertext — it rides the belt as text instead.
   */
  const chocolateText = useMemo(
    () => (puzzle.winText ?? "").replace(/\s+/g, " ").trim().toUpperCase(),
    [puzzle]
  );

  /**
   * Clue lines, one belt row each — the same one-line-per-array-entry contract
   * Encode and Decode already use, so authors control the line breaks.
   */
  const clueLines = useMemo(
    () => (puzzle.clue ?? []).map(line => line.trim()).filter(line => line.length > 0),
    [puzzle]
  );

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
  // Set when the rewind has finished and the view belongs to the player. Until
  // then the belt still owns it, even though the run is over.
  const [viewHandedOver, setViewHandedOver] = useState(false);
  const winReported = useRef(false);
  const lossReported = useRef(false);
  const displayMatrixRef = useRef<DisplayMatrixUpdate>(null);
  const mainDisplayRef = useRef<HTMLDivElement>(null);
  const rowPitchRef = useRef(32);
  // judgedCount = floor(s + judgeOffset). Folds in the line depth and the runway
  // so that at s = 0 nothing is judged. Constant once measured.
  const judgeOffsetRef = useRef(0);
  // The continuous scroll offset, in rows. The one true position of the belt.
  const sRef = useRef(0);
  /*
   * Latched when the run ends (#227): the conveyor's licence to write a
   * transform at all, revoked the moment the rewind takes over the belt.
   *
   * The conveyor loop is a passive effect, so React cancels it asynchronously —
   * after the layout effects that end the run have already run. A frame queued
   * before the win can still fire in between, and it would drive the belt
   * forward against a rewind pulling it back, or resurrect a transform the
   * handover had just cleared. Checked inside the loop rather than fixed by
   * effect ordering, so an already-queued frame is caught whenever it lands.
   */
  const conveyorStoppedRef = useRef(false);
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

  // Who owns the view. The belt keeps it past the end of the run — it still has
  // the rewind to perform — and gives it up only at the handover. Drives the
  // scroll lock and whether the runway is on the belt at all.
  const conveyorDrivesView = clock === "scroll" && !viewHandedOver;

  /**
   * Rendered rows sitting above the first letter: the empty runway, then the
   * clue. Every conversion between a rendered row index and a letter index goes
   * through this, including the conveyor's judging offset.
   *
   * The runway is scaffolding — it exists so the first letter has somewhere to
   * ride up from — so it is only on the belt while the belt is moving (#227).
   * Once the run ends it is just a screenful of blank above the clue with
   * nothing to explain it, and every rendered-row mapping below follows
   * beltOffset down when it goes.
   *
   * Clue rows are pinned to exactly one row pitch in CSS. The belt is translated
   * as a single element on the assumption that every row is the same height, so
   * a clue line tall enough to wrap would drift the letters out from under the
   * judgment line.
   */
  const clueRowCount = clueLines.length;
  const runwayRows = conveyorDrivesView ? spacerCount : 0;
  const beltOffset = runwayRows + clueRowCount;

  // Measure the belt once, then place the runway and the line. Runs before paint
  // (and setState here re-renders before paint) so no unspaced frame is shown.
  useLayoutEffect(() => {
    if (clock !== "scroll" || measured || rowCount === 0) {
      return;
    }
    const container = mainDisplayRef.current;
    /*
     * Two different rows, for two different jobs.
     *
     * beltTop is rendered row 0 — the belt's content origin. It has to be row 0
     * rather than the first letter, because clue rows are still at their CSS
     * fallback height right now and get resized to the measured pitch a moment
     * later; anchoring below them would bake in a height that is about to change.
     *
     * firstRow is the first *letter* row, which is where pitch has to come from:
     * a clue row is pinned to the pitch, so measuring one would be circular.
     */
    const beltTop = displayMatrixRef.current?.getBitRowElement?.(0);
    const firstRow = displayMatrixRef.current?.getBitRowElement?.(beltOffset);
    if (!container || !beltTop || !firstRow) {
      return;
    }
    const secondRow = displayMatrixRef.current?.getBitRowElement?.(beltOffset + 1);
    const pitch = Math.max(
      secondRow
        ? secondRow.getBoundingClientRect().top - firstRow.getBoundingClientRect().top
        : firstRow.offsetHeight,
      1
    );
    const containerTop = container.getBoundingClientRect().top;
    // The belt's content origin, measured — not assumed to equal hudHeight, since
    // padding/margins above the first row shift it.
    const beltTopPx = beltTop.getBoundingClientRect().top - containerTop;
    const hudHeight = container.querySelector<HTMLElement>(".chocolate-hud")?.offsetHeight ?? 0;
    const conveyorVisibleHeight = Math.max(container.clientHeight - hudHeight, pitch);
    const beltRows = conveyorVisibleHeight / pitch;
    /*
     * Where the message starts, counted in rows below the top of the belt.
     *
     * The clue rides the belt now, so it is lead-in too (#227): every clue line
     * is a row of think time before the first letter reaches the judgment line,
     * and the runway only has to make up the difference. Aim to put that first
     * letter on the bottom row of the belt.
     *
     * A clue longer than the belt would ask for a negative runway. Floor it so
     * the clue's own first line starts no higher than the judgment line —
     * flush to the top would read as though the belt had already run past some
     * of it before the player looked.
     */
    const targetDepth = Math.max(Math.floor(beltRows) - 1, 1);
    const minRunway = Math.max(Math.round(LINE_POSITION * beltRows), 1);
    const runway = Math.max(targetDepth - clueRowCount, minRunway);
    const lineTopPx = hudHeight + LINE_POSITION * conveyorVisibleHeight;
    rowPitchRef.current = pitch;
    // Runway and clue rows must both be exactly one pitch tall, or the
    // uniform-pitch transform model drifts by their combined error. Feed the
    // measured pitch to their CSS so message rows land where the formula expects.
    container.style.setProperty("--chocolate-row-pitch", `${pitch}px`);
    // Scoring threshold and painted line share the same measured pixels, so a
    // letter locks exactly as its bottom edge clears the line.
    // judgedCount = floor(s + judgeOffset); letter m is judged when its bottom
    // (at rendered row m + runway + clueRowCount) reaches lineTopPx. The clue is
    // counted in rows of the final pitch, which is why it belongs here and not
    // folded into beltTopPx.
    judgeOffsetRef.current = (lineTopPx - beltTopPx) / pitch - runway - clueRowCount;
    setSpacerCount(runway);
    setLineTopPx(lineTopPx);
    setMeasured(true);
  }, [clock, measured, rowCount, beltOffset, clueRowCount]);

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
      // The run ended after this frame was queued. Drop it: the belt belongs to
      // the rewind now, and then to the player.
      if (conveyorStoppedRef.current) {
        return;
      }
      // Clamp dt so a backgrounded tab doesn't leap the belt forward on return.
      // Floored at zero as well: a frame timestamp can predate the `last` this
      // effect recorded when it ran mid-frame, and a negative dt would drive the
      // belt backwards. Small in a browser, total in jsdom, where the animation
      // clock and performance.now() do not share an origin at all.
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.1);
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

  /*
   * Rewind (#227). The run is over, so run the belt backwards to bring the clue
   * back under the player's eye.
   *
   * Done on the belt's own terms — still transform-driven, still locked —
   * rather than by scrolling, because a transform has no layout to answer to. It
   * can hold the position the belt stopped in, which a scrollTop cannot once the
   * runway is gone and there is nothing rendered past the last letter.
   *
   * The target is s = the runway, which parks the clue's first line exactly at
   * the top of the belt — precisely where scrollTop 0 puts it once the runway is
   * dropped. That is what makes the handover invisible: both are the same
   * pixels, so the only movement the player sees is the rewind itself.
   *
   * A layout effect, so the conveyor is barred from writing before any frame it
   * already queued can land and fight the rewind.
   */
  useLayoutEffect(() => {
    if (clock !== "scroll" || runState !== "won" || viewHandedOver || !measured) {
      return;
    }
    conveyorStoppedRef.current = true;
    const belt = displayMatrixRef.current?.getBitFieldElement?.();
    const from = sRef.current;
    const to = spacerCount;
    const rows = Math.abs(from - to);
    // Nothing worth animating, or a player who has asked not to be moved around.
    if (!belt || rows < 0.01 || prefersReducedMotion()) {
      sRef.current = to;
      setViewHandedOver(true);
      return;
    }
    const duration = Math.min(Math.max(rows * REWIND_MS_PER_ROW, REWIND_MIN_MS), REWIND_MAX_MS);
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      start = start || now;
      const progress = Math.min((now - start) / duration, 1);
      sRef.current = from + (to - from) * easeInOutCubic(progress);
      belt.style.transform = `translate3d(0, ${-sRef.current * rowPitchRef.current}px, 0)`;
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      setViewHandedOver(true);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clock, runState, viewHandedOver, measured, spacerCount]);

  /*
   * The handover (#227).
   *
   * While the belt was running it was a compositor transform inside an
   * overflow-hidden box, so there was nothing for the browser to scroll: the
   * runway and the clue were translated out of view, not scrolled out of it.
   * Unlocking overflow alone would have left them unreachable.
   *
   * The rewind has already parked the belt with the clue at the top, and this
   * same commit takes the runway off it, so the equivalent scroll position is
   * zero — the discount below is what converts between the two.
   *
   * useLayoutEffect because the swap has to land in the same paint as the
   * unlock; in a passive effect the belt would snap for one frame.
   */
  useLayoutEffect(() => {
    if (clock !== "scroll" || !viewHandedOver) {
      return;
    }
    const container = mainDisplayRef.current;
    if (!container) {
      return;
    }
    const belt = displayMatrixRef.current?.getBitFieldElement?.();
    if (belt) {
      belt.style.transform = "";
    }
    container.scrollTop = Math.max((sRef.current - spacerCount) * rowPitchRef.current, 0);
  }, [clock, viewHandedOver, spacerCount]);

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
    if (runState === "lost" && !lossReported.current) {
      lossReported.current = true;
      onLose();
    }
  }, [runState, onWin, onLose]);

  const handleRetry = useCallback(() => {
    setGuessBits(allOffBits());
    setCursor(0);
    setScrolledRows(0);
    scrolledRowsRef.current = 0;
    setStrikes(0);
    setPoints(0);
    setLetterResults([]);
    winReported.current = false;
    lossReported.current = false;
    onRetry();
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
    // Undo the win handover (#227): the belt is about to own the view again, and
    // it steers with the transform, which cannot see a leftover scroll offset.
    conveyorStoppedRef.current = false;
    setViewHandedOver(false);
    if (mainDisplayRef.current) {
      mainDisplayRef.current.scrollTop = 0;
    }
    setRunState("running");
  }, [allOffBits, onRetry]);

  // The game-over panel replaces the belt, so TRY AGAIN can land exactly where
  // the player's last bit tap was.
  const retryControl = useActivationGuard(handleRetry);

  const focusedRow = rowOf(Math.min(cursor, Math.max(winBits.length - 1, 0)));

  /*
   * The win screen waits for the rewind (#227). Dessert ends with the belt
   * running back to the clue, and dropping a dialog over that the instant the
   * last bit lands would throw the beat away. The player-paced clocks have no
   * rewind to wait on, so for them the run being won is the whole cue.
   */
  const winScreenReady = runState === "won" && (clock !== "scroll" || viewHandedOver);

  /*
   * The message as the player actually received it, letter by letter (#227).
   *
   * A Dessert run is won by surviving the conveyor, not by being right, so what
   * was gleaned can be partial: every letter the belt carried past the line
   * unsolved stays purple on the transcript. This is what letterResults has been
   * kept whole for rather than collapsed to a count.
   *
   * The player-paced clocks can only be won outright, so there letterResults is
   * empty and the live judgment answers for every row — all of them correct.
   */
  const gleanedAnswer = useMemo(() => displayRows.map((row, letterIndex) => (
    <span
      key={`gleaned-${letterIndex}`}
      className={(letterResults[letterIndex] ?? isRowCorrect(letterIndex))
        ? "answer-correct"
        : "answer-incorrect"}
    >
      {row.annotation}
    </span>
  )), [displayRows, letterResults, isRowCorrect]);

  // Step the focused row into view when the player moved the cursor — but never
  // in Dessert, where the belt owns the view. The no-deps effect clears any
  // leftover flag every render so a stale flag can't fire on a later tick.
  useEffect(() => {
    const follow = shouldFollowCursor.current;
    shouldFollowCursor.current = false;
    if (!follow || clock === "scroll") {
      return;
    }
    const rowElement = displayMatrixRef.current?.getBitRowElement?.(focusedRow + beltOffset);
    rowElement?.scrollIntoView({ block: "nearest" });
  });

  /*
   * Rendered rows: the runway while the belt is moving, then the clue, then the
   * whole message. Judged rows stay on screen (locked) and ride up behind the
   * HUD. Nothing is rendered past the last letter — the message is the end of
   * the belt, so that is where the scroll ends too.
   *
   * A clue row carries its text as a DisplayRow annotation over an empty bit
   * sequence, so it renders as text on the belt with no bits to toggle and no
   * gutter letter — and rides up and off ahead of the message, as intended.
   */
  const renderedRows = useMemo(() => {
    const spacers = Array.from({ length: runwayRows }, () => new DisplayRow(BitSequence.empty(), ""));
    const clues = clueLines.map(line => new DisplayRow(BitSequence.empty(), line));
    return [...spacers, ...clues, ...displayRows];
  }, [runwayRows, clueLines, displayRows]);

  const rowClassName = useCallback((renderedRowIndex: number) => {
    if (renderedRowIndex < runwayRows) {
      return "conveyor-spacer";
    }
    if (renderedRowIndex < beltOffset) {
      return "conveyor-clue";
    }
    const letterRow = renderedRowIndex - beltOffset;
    const classes = [isRowCorrect(letterRow) ? "letter-correct" : "letter-incorrect"];
    if (runState === "running" && letterRow === focusedRow) {
      classes.push("focused-row");
    }
    return classes.join(" ");
  }, [runwayRows, beltOffset, isRowCorrect, runState, focusedRow]);

  // Left gutter: the target letter for this row. Runway and clue rows have none.
  const renderTarget = useCallback((renderedRowIndex: number) => {
    if (renderedRowIndex < beltOffset) {
      return "";
    }
    return visibleChar(targetChars[renderedRowIndex - beltOffset] ?? "");
  }, [beltOffset, targetChars]);

  if (!puzzle) {
    // No crashes!
    return <></>;
  }

  return (
    <div id="game-content">
      <div
        id="main-display"
        className={`display chocolate-display${conveyorDrivesView ? " conveyor-locked" : ""}`}
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
        {/* Goes with the run, not with the belt: the rewind judges nothing. */}
        {clock === "scroll" && runState === "running" && measured && (
          <div className="chocolate-judgment-line" style={{ top: lineTopPx }} aria-hidden="true" />
        )}
        {runState === "lost" ? (
          <div className="chocolate-game-over">
            <p>The conveyor got ahead of you!</p>
            <p>SCORE {points}</p>
            <p>LETTERS GLEANED {letterResults.filter(Boolean).length}/{rowCount}</p>
            <button type="button" {...retryControl}>TRY AGAIN</button>
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
                correctness={isRowCorrect(rowIndex - beltOffset)
                  ? Correctness.correct
                  : Correctness.incorrect}
                onBitToggle={handleBitToggle}
              />
            )}
          />
        )}
      </div>
      <WinScreen
        won={winScreenReady}
        clue={clueLines}
        answer={gleanedAnswer}
        winMessage={puzzle.winMessage ?? []}
        actions={winActions}
        stats={clock === "scroll" ? (
          <>
            <span>SCORE {points}</span>
            <span>GLEANED {letterResults.filter(Boolean).length}/{rowCount}</span>
          </>
        ) : undefined}
      />
    </div>
  );
};

export { ChocolateMode };
