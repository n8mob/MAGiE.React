import {useEffect, useState} from "react";
import EncodePuzzle from "./EncodePuzzle.tsx";
import DecodePuzzle from "./DecodePuzzle.tsx";
import {Puzzle} from "../Menu.ts";

interface DailyPuzzleProps {
  puzzle: Puzzle;
  date: Date;
}

const DailyPuzzle = ({puzzle, date}: DailyPuzzleProps) => {
  const [currentPuzzle, setCurrentPuzzle] = useState(puzzle);
  const [winMessage, setWinMessage] = useState(puzzle.winMessage);
  const [hasWon, setHasWon] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  const [shareText, setShareText] = useState("");

  useEffect(() => {
    setCurrentPuzzle(puzzle);
    setWinMessage(puzzle.winMessage);
    setHasWon(false);

    const prettyOptions: Intl.DateTimeFormatOptions = {weekday: 'long', month: 'long', day: 'numeric'};
    const userLocale = navigator.language;
    const formattedDate = date.toLocaleDateString(userLocale, prettyOptions);
    setFormattedDate(formattedDate)
    const todayString = date.getDate() == new Date().getDate() ? "today, " : "";
    setShareText(`I decoded the MAGiE puzzle for ${todayString}${formattedDate}!`);
  }, [puzzle, date]);

  const handleWin = () => {
    setHasWon(true);
  };

  const handleShareWin = () => {
    if (navigator.share) {
      navigator.share({
        title: "MAGiE binary puzzles",
        text: shareText,
        url: window.location.href,
      })
        .catch(console.error);
    } else if (navigator.clipboard) {
      const shareViaClipboard =
        'It seems that this browser does not support "Web Share".'
        + '\nShall we copy the share message to your clipboard?';
      if (window.confirm(shareViaClipboard)) {
        navigator.clipboard.writeText(shareText)
          .then(() => {alert("The share message has been copied to your clipboard.");})
          .catch(error => {
            console.error('Failed to copy text: ', error);
            alert("Sorry, we couldn't copy the text to your clipboard either.");
          });
      }
    } else {
      const message = 'It seems that this browser supports '
      + 'neither web share nor programmatic clipboard access.\n\n'
      + 'The following message was prepared for sharing:\n\n'
      + shareText;
      alert(message);
    }
  };

  if (!currentPuzzle) {
    return <div>Loading...</div>;
  } else {
    return <>
      <h2>{formattedDate}</h2>
      <div className="display">
        {currentPuzzle.clue.map((line, index) => <p key={`clue-line-${index}`}>{line}</p>)}
      </div>
      {currentPuzzle.type === "Encode" ? (
        <EncodePuzzle puzzle={currentPuzzle} onWin={handleWin} displayWidth={7}/>
      ) : (
        <DecodePuzzle puzzle={currentPuzzle} onWin={handleWin} displayWidth={7}/>
      )}
      {hasWon && <div>
        <div className="display">
          {winMessage.map((line, index) => <p key={`winMessageLine-${index}`}>{line}</p>)}
        </div>
        <div className="share-controls">
          <button onClick={handleShareWin}>Share Your Win</button>
        </div>
      </div>}
    </>
  }
};

export default DailyPuzzle;
