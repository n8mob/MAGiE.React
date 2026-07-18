// noinspection DuplicatedCode

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EncodePuzzle } from "./EncodePuzzle.tsx";
import { DecodePuzzle } from "./DecodePuzzle.tsx";
import { ChocolateMode } from "./ChocolateMode.tsx";
import { Puzzle } from "../model.ts";
import { chocolateEncoding, FIVE_BIT_A1_NAME } from "../encoding/FiveBitA1.ts";
import { Stopwatch, StopwatchHandle } from "./Stopwatch.tsx";
import ReactGA4 from "react-ga4";
import { debug  } from "../Logger.ts";
import { useHeader } from "../hooks/useHeader.ts";

interface PlayPuzzleProps {
  puzzle: Puzzle;
  puzzleShareString: string;
  onWin?: (stopwatch: StopwatchHandle) => void;
  onShareWin?: () => void;
  /** Play this puzzle in Chocolate mode regardless of its type (e.g. the /chocolate area). */
  asChocolate?: boolean;
}

const PlayPuzzle = ({ puzzle: rawPuzzle, puzzleShareString, onWin, onShareWin, asChocolate = false }: PlayPuzzleProps) => {
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
  const winAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    winAudio.current = new Audio('/sounds/big-ta-da.wav');
    winAudio.current.load();
    winAudio.current.volume = 0.25;
    return () => {
      // TODO test if this quits playing if the user hits "next" very quickly.
      // that may be fine. I dunno.
      winAudio.current?.pause();
    };
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
    const isAutoWin = puzzle.init === puzzle.winText;
    let solveTimeSeconds = -1;
    if (stopwatchRef.current) {
      stopwatchRef.current.stop();
      solveTimeSeconds = stopwatchRef.current.getTotalSeconds();
      updateSolveTimeString();
    }
    if (!isAutoWin) {
      if (winAudio.current) {
        winAudio.current.play().catch((error) => {
          console.warn("Audio playback failed:", error);
        });
      }
      ReactGA4.event("win", {
        puzzle_slug: puzzle.slug,
        winText: puzzle.winText,
        encoding: puzzle.encoding_name,
        encoding_type: puzzle.encoding.getType(),
        pagePath: window.location.pathname + window.location.search,
        solve_time_seconds: solveTimeSeconds,
      });
    }
    if (onWin) {
      onWin(stopwatchRef.current!);
    }
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
          onShareWin={handleShareWin}
          bitButtonWidthPx={32}
        />
      }
    </>
  );
};

export { PlayPuzzle };
