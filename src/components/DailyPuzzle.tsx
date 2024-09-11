import {useEffect, useState, useRef} from "react";
import EncodePuzzle from "./EncodePuzzle.tsx";
import DecodePuzzle from "./DecodePuzzle.tsx";
import {Puzzle} from "../Menu.ts";
import Stopwatch, {StopwatchHandle} from "./Stopwatch.tsx";

interface DailyPuzzleProps {
  puzzle: Puzzle;
  date: Date;
}

const DailyPuzzle = ({puzzle, date}: DailyPuzzleProps) => {
  const [currentPuzzle, setCurrentPuzzle] = useState(puzzle);
  const [hasWon, setHasWon] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  const [puzzleDayString, setPuzzleDayString] = useState("");
  const [solveTimeString, setSolveTimeString] = useState("");
  const [displayWidth, setDisplayWidth] = useState(13); // Default value
  const stopwatchRef = useRef<StopwatchHandle>(null);
  const bitFieldRef = useRef<HTMLDivElement>(null);

  const updateShareText = () => {
    if (stopwatchRef.current) {
      const h = stopwatchRef.current.getHours();
      const m = stopwatchRef.current.getMinutes();
      const s = stopwatchRef.current.getSeconds();
      let timeDescription: string;

      let seconds = "seconds";
      if (s == 1) {
        seconds = "second";
      }
      let minutes = "minutes";
      if (m == 1) {
        minutes = "minute";
      }

      if (h > 0) {
        timeDescription = stopwatchRef.current.displayTime();
      } else if (m > 0) {
        timeDescription = `${m} ${minutes} and ${s} ${seconds}`;
      } else {
        timeDescription = `${s} ${seconds}`;
      }
      setSolveTimeString(`It took me ${timeDescription}.`)
    }
  };

  useEffect(() => {
    setCurrentPuzzle(puzzle);
    setHasWon(false);

    const prettyOptions: Intl.DateTimeFormatOptions = {weekday: 'long', month: 'short', day: 'numeric'};
    const userLocale = navigator.language;
    const formattedDate = date.toLocaleDateString(userLocale, prettyOptions);
    setFormattedDate(formattedDate);
    const todayString = date.getDate() == new Date().getDate() ? "today, " : "";
    setPuzzleDayString(`I decoded the MAGiE puzzle for ${todayString}${formattedDate}!`);

    const updateDisplayWidth = () => {
      const elementId = "bit-field";
      const bitField = document.getElementById(elementId);
      let displayWidthPixels;
      if (!bitField) {
        displayWidthPixels = Math.floor(window.innerWidth * 0.85);
      } else {
        displayWidthPixels = parseInt(getComputedStyle(bitField).width);
      }

      const bitCheckboxWidth = 32;
      const newDisplayWidth = Math.floor(displayWidthPixels / bitCheckboxWidth);
      setDisplayWidth(newDisplayWidth);
    };

    updateDisplayWidth();

    window.addEventListener("resize", updateDisplayWidth);

    return () => {
      window.removeEventListener("resize", updateDisplayWidth);
    };
  }, [puzzle, date]);

  useEffect(() => {
    const handleWinEvent = () => {
      setHasWon(true);
      if (stopwatchRef.current) {
        stopwatchRef.current.stop();
        if (bitFieldRef.current) {
          bitFieldRef.current.scrollTo({
            top: bitFieldRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
        updateShareText();
      }
      // Play sound here
      const audio = new Audio('path/to/sound.mp3');
      audio.play();
    };

    window.addEventListener("winEvent", handleWinEvent);

    return () => {
      window.removeEventListener("winEvent", handleWinEvent);
    };
  }, []);

  const handleWin = () => {
    const winEvent = new Event("winEvent");
    window.dispatchEvent(winEvent);
  };

  const handleShareWin = () => {
    const shareText = `${puzzleDayString}\n${solveTimeString}`;

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
  } else {
    return (
      <>
        <h3>{formattedDate}</h3>
        <Stopwatch ref={stopwatchRef}/>
        {currentPuzzle.type === "Encode" &&
          <EncodePuzzle
            puzzle={currentPuzzle}
            onWin={handleWin}
            hasWon={hasWon}
            onShareWin={handleShareWin}
            displayWidth={displayWidth}
            key={`${currentPuzzle}-${displayWidth}`}
          />
        }
        {currentPuzzle.type === "Decode" &&
          <DecodePuzzle
            puzzle={currentPuzzle}
            onWin={handleWin}
            hasWon={hasWon}
            onShareWin={handleShareWin}
            displayWidth={displayWidth}
            key={`${currentPuzzle}-${displayWidth}`}
          />
        }
      </>
    );
  }
};

export default DailyPuzzle;
