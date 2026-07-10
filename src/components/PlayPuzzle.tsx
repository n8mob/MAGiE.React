// noinspection DuplicatedCode

import { useEffect, useRef, useState } from "react";
import { EncodePuzzle } from "./EncodePuzzle.tsx";
import { DecodePuzzle } from "./DecodePuzzle.tsx";
import { Puzzle } from "../model.ts";
import { Stopwatch, StopwatchHandle } from "./Stopwatch.tsx";
import ReactGA4 from "react-ga4";
import { debug  } from "../Logger.ts";
import { useHeader } from "../hooks/useHeader.ts";

interface PlayPuzzleProps {
  puzzle: Puzzle;
  puzzleShareString: string;
  onWin?: (stopwatch: StopwatchHandle) => void;
  onShareWin?: () => void;
}

const PlayPuzzle = ({ puzzle, puzzleShareString, onWin, onShareWin }: PlayPuzzleProps) => {
  const { setStopwatchDisplay } = useHeader();
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
    </>
  );
};

export { PlayPuzzle };
