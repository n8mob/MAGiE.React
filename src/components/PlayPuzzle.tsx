// noinspection DuplicatedCode

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EncodePuzzle } from "./EncodePuzzle.tsx";
import { DecodePuzzle } from "./DecodePuzzle.tsx";
import { ChocolateMode } from "./ChocolateMode.tsx";
import { Puzzle } from "../model.ts";
import { chocolateEncoding, FIVE_BIT_A1_NAME } from "../encoding/FiveBitA1.ts";
import { Stopwatch, StopwatchHandle } from "./Stopwatch.tsx";
import ReactGA4 from "react-ga4";
import { PuzzlePlacement, resolvePuzzleContext, trackPuzzleEnd, trackPuzzleStart, } from "../analytics/puzzleAnalytics.ts";
import { debug  } from "../Logger.ts";
import { useHeader } from "../hooks/useHeader.ts";
import { loadSound, playSound } from "../audio/SoundPlayer.ts";
import { SOUNDS } from "../audio/sounds.ts";

interface PlayPuzzleProps {
  puzzle: Puzzle;
  puzzleShareString: string;
  onWin?: (stopwatch: StopwatchHandle) => void;
  onShareWin?: () => void;
  /**
   * Where the player can go once they've won — Next, Share, back to the
   * category. The route knows the answer; only this component knows which mode
   * ended up rendering, and therefore whether the answer belongs on a win screen
   * or under the puzzle. Passed here rather than rendered by the route so that
   * one decision lives in one place.
   */
  winActions?: ReactNode;
  /** Play this puzzle in Chocolate mode regardless of its type (e.g. the /chocolate area). */
  asChocolate?: boolean;
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
  asChocolate = false,
  placement,
}: PlayPuzzleProps) => {
  const { setStopwatchDisplay } = useHeader();
  const [searchParams] = useSearchParams();
  /*
   * Whether this puzzle has been won, for deciding when the after-win controls
   * appear.
   *
   * It belongs here rather than in the routes: both of them key this component
   * by puzzle slug, so it remounts per puzzle and the flag resets by itself.
   * LevelPlay had to clear its own copy during render instead (#223), because
   * LevelPlay is *not* remounted and a child's win arrives before a parent
   * effect could run. Nothing to clear, nothing to race.
   */
  const [hasWon, setHasWon] = useState(false);

  // Existing Encode/Decode puzzles double as Chocolate content, forced either by
  // the asChocolate prop (the /chocolate area) or by the ?asChocolate query param
  // (ad-hoc testing on any route). The query param's optional value picks the
  // clock (?asChocolate=none|advance|scroll); otherwise the ChocolateMode
  // default applies.
  const puzzle = useMemo<Puzzle>(() => {
    let p = rawPuzzle;
    if (p
      && (asChocolate || searchParams.has("asChocolate"))
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

  // puzzle_type and encoding come from the puzzle as *played*, after any
  // Chocolate coercion above — the route can't know either one.
  const analytics = useMemo(
    () => (placement ? resolvePuzzleContext(placement, puzzle) : null),
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
    setHasWon(true);
    const isAutoWin = puzzle.init === puzzle.winText;
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
    setHasWon(false);
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

  return (
    <>
      <Stopwatch
        ref={stopwatchRef}
        onDisplayChange={setStopwatchDisplay}
        visible={false}
      />
      {puzzle.type === "Encode" &&
        <EncodePuzzle
          puzzle={puzzle}
          onWin={handleWin}
          onShareWin={handleShareWin}
          bitButtonWidthPx={32}
        />
      }
      {puzzle.type === "Decode" &&
        <DecodePuzzle
          puzzle={puzzle}
          onWin={handleWin}
          onShareWin={handleShareWin}
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
          bitButtonWidthPx={32}
        />
      }
      {/* Chocolate puts these on its win screen. The other modes have no such
          screen yet, so they keep the panel under the puzzle they've always
          had — the same markup the routes used to render themselves. */}
      {hasWon && puzzle.type !== "Chocolate" && winActions && (
        <div className="after-win-controls">{winActions}</div>
      )}
    </>
  );
};

export { PlayPuzzle };
