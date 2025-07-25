// noinspection DuplicatedCode

import { useEffect, useRef, useState } from "react";
import { EncodePuzzle } from "./EncodePuzzle.tsx";
import { DecodePuzzle } from "./DecodePuzzle.tsx";
import { Puzzle } from "../Menu.ts";
import { Stopwatch, StopwatchHandle } from "./Stopwatch.tsx";
import ReactGA4 from "react-ga4";

interface PlayPuzzleProps {
  puzzle: Puzzle;
  puzzleShareString: string;
  onWin?: () => void;
  onShareWin?: () => void;
  hasWon?: boolean;
}

const PlayPuzzle = ({ puzzle, puzzleShareString, onWin, onShareWin, hasWon: hasWonProp }: PlayPuzzleProps) => {
  const [currentPuzzle, setCurrentPuzzle] = useState(puzzle);
  const [hasWon, setHasWon] = useState(false);
  const [solveTimeString, setSolveTimeString] = useState("");
  const stopwatchRef = useRef<StopwatchHandle | null>(null);
  const winAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    winAudio.current = new Audio('/sounds/big-ta-da.wav');
    winAudio.current.load();
    winAudio.current.volume = 0.25;
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
    setCurrentPuzzle(puzzle);
    setHasWon(false);
    setSolveTimeString("");
  }, [puzzle]);

  useEffect(() => {
    const handleWinEvent = () => {
      setHasWon(true);
      let solveTimeSeconds = -1;
      if (stopwatchRef.current) {
        stopwatchRef.current.stop();
        solveTimeSeconds = stopwatchRef.current.getTotalSeconds();
        updateSolveTimeString();
      }
      if (winAudio.current) {
        winAudio.current.play().catch((error) => {
          console.warn("Audio playback failed:", error);
        });
      }
      ReactGA4.event("win", {
        puzzle_slug: currentPuzzle.slug,
        winText: currentPuzzle.winText,
        encoding: currentPuzzle.encoding_name,
        encoding_type: currentPuzzle.encoding.getType(),
        pagePath: window.location.pathname + window.location.search,
        solve_time_seconds: solveTimeSeconds,
      });
      if (onWin) onWin();
    };
    window.addEventListener("winEvent", handleWinEvent);
    return () => {
      window.removeEventListener("winEvent", handleWinEvent);
    };
  }, [currentPuzzle, onWin]);

  const handleWin = () => {
    const winEvent = new Event("winEvent");
    window.dispatchEvent(winEvent);
  };

  const handleShareWin = () => {
    const shareText = `${puzzleShareString}\n${solveTimeString}`;
    if (onShareWin) {
      onShareWin();
    }
    if (navigator.share) {
      navigator.share({
        title: "MAGiE binary puzzles",
        text: shareText,
        url: window.location.href,
      }).catch(console.error);
    } else if (navigator.clipboard) {
      const shareViaClipboard =
        'It seems that this browser does not support "Web Share".' +
        '\nShall we copy the share message to your clipboard?';
      if (window.confirm(shareViaClipboard)) {
        navigator.clipboard.writeText(shareText)
          .then(() => {
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

  if (!currentPuzzle) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Stopwatch ref={stopwatchRef} />
      {currentPuzzle.type === "Encode" &&
        <EncodePuzzle
          puzzle={currentPuzzle}
          onWin={handleWin}
          hasWon={hasWonProp ?? hasWon}
          onShareWin={handleShareWin}
          bitDisplayWidthPx={32}
        />
      }
      {currentPuzzle.type === "Decode" &&
        <DecodePuzzle
          puzzle={currentPuzzle}
          onWin={handleWin}
          hasWon={hasWonProp ?? hasWon}
          onShareWin={handleShareWin}
          bitDisplayWidthPx={32}
        />
      }
    </>
  );
};

export { PlayPuzzle };

