// noinspection DuplicatedCode

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EncodePuzzle } from "./EncodePuzzle.tsx";
import { DecodePuzzle } from "./DecodePuzzle.tsx";
import { ChocolateMode } from "./ChocolateMode.tsx";
import { isAutoWinPuzzle, Puzzle } from "../model.ts";
import { chocolateEncoding, FIVE_BIT_A1_NAME } from "../encoding/FiveBitA1.ts";
import { Stopwatch, StopwatchHandle } from "./Stopwatch.tsx";
import ReactGA4 from "react-ga4";
import { PuzzlePlacement, resolvePuzzleContext, trackPuzzleEnd, trackPuzzleStart, } from "../analytics/puzzleAnalytics.ts";
import { debug } from "../Logger.ts";
import { useHeader } from "../hooks/useHeader.ts";
import { loadSound, playSound } from "../audio/SoundPlayer.ts";
import { SOUNDS } from "../audio/sounds.ts";
import { DualChannelPlay } from "./DualChannelPlay.tsx";

/**
 * One line of CH 2 for its strip, chosen so it never gives the puzzle away.
 * A Decode puzzle's bits are already on display, so they can bleed through; an
 * Encode puzzle's are the answer, so it gets a texture instead of data.
 */
const signalPreview = (puzzle: Puzzle): string =>
  puzzle.type === "Decode"
    ? (puzzle.encoding?.encodeText(puzzle.winText)?.toPlainString() ?? "")
    : "\u00b7 ".repeat(24).trim();

interface PlayPuzzleProps {
  puzzle: Puzzle;
  puzzleShareString: string;
  onWin?: (stopwatch: StopwatchHandle) => void;
  onShareWin?: () => void;
  /**
   * Where the player can go once they've won — Next, Share, back to the
   * category. The route knows the answer but not the shape of the win, so it
   * hands the controls to whichever mode renders and lets that mode decide
   * whether they belong on its win screen or in a panel under the puzzle.
   */
  winActions?: ReactNode;
  /**
   * Keep the win inline rather than on the win screen. Set by the tutorial,
   * whose lessons point at the bit grid a modal would cover. Chocolate has no
   * inline win to fall back to and always uses the screen.
   */
  winInline?: boolean;
  /** Play this puzzle in Chocolate mode regardless of its type (e.g. the /chocolate area). */
  asChocolate?: boolean;
  /**
   * Split this puzzle across the two communications channels: the clue and the
   * win transcript on CH 1, the bits on CH 2. Chocolate is excluded — its clue
   * rides the conveyor as prose (#231), so there is nothing to lift off it.
   */
  dualChannel?: boolean;
  /**
   * Where this puzzle sits in the content, from whichever route loaded it.
   * Omit to play without emitting funnel events.
   */
  placement?: PuzzlePlacement;
}

const PlayPuzzle = ({
  puzzle: rawPuzzle,
  puzzleShareString,
  onWin,
  onShareWin,
  winActions,
  winInline = false,
  asChocolate = false,
  dualChannel = false,
  placement,
}: PlayPuzzleProps) => {
  const { setStopwatchDisplay } = useHeader();
  const [searchParams] = useSearchParams();

  // Existing Encode/Decode puzzles double as Chocolate content, forced either by
  // the asChocolate prop (the /chocolate area) or by the ?asChocolate query param
  // (ad-hoc testing on any route). The query param's optional value picks the
  // clock (?asChocolate=none|advance|scroll); otherwise the ChocolateMode
  // default applies.
  const puzzle = useMemo<Puzzle>(() => {
    let p = rawPuzzle;
    if (p
      && (
        asChocolate || searchParams.has("asChocolate")
      )
      && p.type !== "Chocolate"
    ) {
      const clockParam = searchParams.get("asChocolate");
      const clock = clockParam === "none" || clockParam === "advance" || clockParam === "scroll"
        ? clockParam
        : undefined;
      p = { ...p, type: "Chocolate", clock };
    }
    // Chocolate requires a fixed-width encoding; variable-width (alpha-length)
    // and missing encodings fall back to the built-in 5bA1.
    if (p && p.type === "Chocolate") {
      const encoding = chocolateEncoding(p.encoding);
      if (encoding !== p.encoding) {
        p = { ...p, encoding, encoding_name: FIVE_BIT_A1_NAME };
      }
    }
    return p;
  }, [rawPuzzle, asChocolate, searchParams]);
  const [solveTimeString, setSolveTimeString] = useState("");
  const stopwatchRef = useRef<StopwatchHandle | null>(null);

  // Like ?asChocolate, so any existing puzzle can be played split without a
  // route of its own. Chocolate opts out: it has no clue to lift off the belt.
  const playsSplit = (dualChannel || searchParams.has("dualChannel"))
    && puzzle?.type !== "Chocolate";

  /*
   * A copy of the win, purely so the shell knows when to tune back to CH 1.
   * useBasePuzzle's own hasWon stays the flag that decides what a *mode* draws
   * (#223) — this one decides nothing inside the mode, and is keyed to the slug
   * so moving to the next puzzle starts over.
   */
  const [wonForChannel, setWonForChannel] = useState(false);
  const [renderedSlug, setRenderedSlug] = useState(puzzle?.slug);
  if (puzzle?.slug !== renderedSlug) {
    setRenderedSlug(puzzle?.slug);
    setWonForChannel(false);
  }

  // puzzle_type and encoding come from the puzzle as *played*, after any
  // Chocolate coercion above — the route can't know either one.
  const analytics = useMemo(
    () => (
      placement ? resolvePuzzleContext(placement, puzzle) : null
    ),
    [placement, puzzle]
  );

  // The stopwatch runs for the whole screen and has no reset, so each attempt
  // reports its duration as a delta from wherever the previous one ended.
  const attemptStartSeconds = useRef(0);
  const startedSlug = useRef<string | null>(null);
  const attemptOpen = useRef(false);

  const startAttempt = useCallback(() => {
    if (!analytics) {
      return;
    }
    startedSlug.current = analytics.puzzle_slug;
    attemptStartSeconds.current = stopwatchRef.current?.getTotalSeconds() ?? 0;
    attemptOpen.current = true;
    trackPuzzleStart(analytics);
  }, [analytics]);

  const endAttempt = useCallback((outcome: "won" | "lost") => {
    if (!analytics) {
      return;
    }
    // Open the attempt if nothing has yet. An auto-win puzzle arrives already
    // solved, and the judgment that spots it lives in a child component — React
    // flushes child effects before parent ones, so the win lands here before this
    // component's own mount effect has run. Without this, those puzzles emit an
    // end with no start, which is precisely the shape the abandonment inference
    // treats as a phantom.
    if (!attemptOpen.current) {
      startAttempt();
    }
    attemptOpen.current = false;
    const total = stopwatchRef.current?.getTotalSeconds() ?? 0;
    trackPuzzleEnd(analytics, outcome, Math.max(0, total - attemptStartSeconds.current));
  }, [analytics, startAttempt]);

  // Mount only. Retries fire their own start from handleRetry, and the slug guard
  // covers both StrictMode's double-invoke and an auto-win that already opened
  // the attempt from endAttempt above.
  useEffect(() => {
    if (!analytics || startedSlug.current === analytics.puzzle_slug) {
      return;
    }
    startAttempt();
  }, [analytics, startAttempt]);

  useEffect(() => {
    void loadSound(SOUNDS.win);
  }, []);

  const updateSolveTimeString = () => {
    if (stopwatchRef.current) {
      const h = stopwatchRef.current.getHours();
      const m = stopwatchRef.current.getMinutes();
      const s = stopwatchRef.current.getSeconds();
      let timeDescription: string;
      const seconds = s === 1 ? "second" : "seconds";
      const minutes = m === 1 ? "minute" : "minutes";
      if (h > 0) {
        timeDescription = stopwatchRef.current.displayTime();
      } else if (m > 0) {
        timeDescription = `${m} ${minutes} and ${s} ${seconds}`;
      } else {
        timeDescription = `${s} ${seconds}`;
      }
      setSolveTimeString(`It took me ${timeDescription}.`);
    }
  };

  useEffect(() => {
    setStopwatchDisplay("00:00");
    return () => setStopwatchDisplay("");
  }, [setStopwatchDisplay]);

  const handleWin = () => {
    debug("PlayPuzzle detected winEvent");
    const isAutoWin = isAutoWinPuzzle(puzzle);
    if (stopwatchRef.current) {
      stopwatchRef.current.stop();
      updateSolveTimeString();
    }
    // The sound stays suppressed on auto-win puzzles — they open already solved,
    // so a fanfare on arrival is just noise. The event is *not* suppressed: those
    // are the tutorial's demo screens, and dropping them punched a hole in
    // exactly the onboarding funnel this is meant to measure.
    if (!isAutoWin) {
      playSound(SOUNDS.win);
    }
    endAttempt("won");
    setWonForChannel(true);
    if (onWin) {
      onWin(stopwatchRef.current!);
    }
  };

  // Chocolate is the only mode that can end in a loss, and its TRY AGAIN resets
  // in place, so the retry has to announce itself — a mount-only start would
  // leave the next puzzle_end with no matching start.
  // Deliberately does not stop the stopwatch: the next startAttempt() rebases off
  // its running total, so time spent reading the game-over screen falls between
  // the two attempts and is counted in neither.
  const handleLose = () => {
    debug("PlayPuzzle detected loss");
    endAttempt("lost");
  };

  const handleRetry = () => {
    debug("PlayPuzzle detected retry");
    startAttempt();
  };

  const handleShareWin = () => {
    const shareText = `${puzzleShareString}\n${solveTimeString}`;
    ReactGA4.event('share_win_clicked', {
      puzzle_slug: puzzle.slug,
    });
    if (onShareWin) {
      onShareWin();
    }
    if (navigator.share) {
      navigator.share({
        title: "MAGiE binary puzzles",
        text: shareText,
        url: window.location.href,
      }).then(() => {
        ReactGA4.event('share_win_completed', {
          puzzle_slug: puzzle.slug,
          share_method: 'native',
        });
      }).catch(console.error);
    } else if (navigator.clipboard) {
      const shareViaClipboard =
        'It seems that this browser does not support "Web Share".' +
        '\nShall we copy the share message to your clipboard?';
      if (window.confirm(shareViaClipboard)) {
        navigator.clipboard.writeText(`${shareText}\n\n` + window.location.href)
        .then(() => {
          ReactGA4.event('share_win_completed', {
            puzzle_slug: puzzle.slug,
            share_method: 'clipboard',
          });
          alert("The share message has been copied to your clipboard.");
        })
        .catch((error) => {
          console.error("Failed to copy text: ", error);
          alert("Sorry, we couldn't copy the text to your clipboard either.");
        });
      }
    } else {
      const message =
        'It seems that this browser supports ' +
        'neither web share nor programmatic clipboard access.\n\n' +
        'The following message was prepared for sharing:\n\n' +
        shareText;
      alert(message);
    }
  };

  if (!puzzle) {
    return <div>Loading...</div>;
  }

  // Split play hands the clue, the transcript and the after-win controls to the
  // shell, so the mode itself is asked for nothing but the machine.
  const mode = (
    <>
      {puzzle.type === "Encode" &&
        <EncodePuzzle
          puzzle={puzzle}
          onWin={handleWin}
          onShareWin={handleShareWin}
          winActions={playsSplit ? undefined : winActions}
          winInline={winInline}
          textElsewhere={playsSplit}
          bitButtonWidthPx={32}
        />
      }
      {puzzle.type === "Decode" &&
        <DecodePuzzle
          puzzle={puzzle}
          onWin={handleWin}
          onShareWin={handleShareWin}
          winActions={playsSplit ? undefined : winActions}
          winInline={winInline}
          textElsewhere={playsSplit}
          bitButtonWidthPx={32}
        />
      }
      {puzzle.type === "Chocolate" &&
        <ChocolateMode
          puzzle={puzzle}
          onWin={handleWin}
          onLose={handleLose}
          onRetry={handleRetry}
          onShareWin={handleShareWin}
          winActions={winActions}
          winInline={winInline}
          bitButtonWidthPx={32}
        />
      }
    </>
  );

  return (
    <>
      <Stopwatch
        ref={stopwatchRef}
        onDisplayChange={setStopwatchDisplay}
        visible={false}
      />
      {playsSplit
        ? (
          <DualChannelPlay
            key={puzzle.slug}
            puzzle={puzzle}
            won={wonForChannel}
            isAutoWin={isAutoWinPuzzle(puzzle)}
            signalPreview={signalPreview(puzzle)}
            winActions={winActions}
          >
            {mode}
          </DualChannelPlay>
        )
        : mode}
    </>
  );
};

export { PlayPuzzle };
