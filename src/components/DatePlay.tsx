import { Link, useParams } from "react-router-dom";
import { getDailyPuzzleForDate } from "../PuzzleApi.ts";
import { PlayPuzzle } from "./PlayPuzzle";
import { FC, useEffect, useState } from "react";
import { Puzzle } from "../model.ts";
import { fetchPuzzle } from "../FetchPuzzle.tsx";
import { useHeader } from "../hooks/useHeader.ts";
import { shortDate } from "./DateFormatter.tsx";
import ReactGA4 from "react-ga4";
import { StopwatchHandle } from "./Stopwatch.tsx";
import { debug } from "../Logger.ts";


const addDays = (date: Date, days: number) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

const dateLinkFormat = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

type DayPuzzleProps = {
  initialDate?: Date;
}

export const DatePlay: FC<DayPuzzleProps> = ({ initialDate }) => {
  const { setHeaderContent } = useHeader();
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const { year, month, day } = useParams<{ year?: string, month?: string, day?: string }>();
  const [formattedDate, setFormattedDate] = useState("");
  const [dateShareString, setDateShareString] = useState("");
  const [solveTimeDisplay, setSolveTimeDisplay] = useState("");
  const [solveTimeDescription, setSolveTimeDescription] = useState("");
  const [hasWon, setHasWon] = useState(false);
  const [puzzleDate, setPuzzleDate] = useState<Date | null>(null);
  const linkToToday = <Link to={"/today"}>Rewind to today</Link>;
  const isFirstVisit = !localStorage.getItem('isFirstVisit');

  useEffect(() => {
    if (initialDate) {
      console.log("Setting puzzle date to initial date:", initialDate);
      setPuzzleDate(initialDate);
    } else if (year && month && day) {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      console.log(`Setting puzzle date to ${year}-${month}-${day}:`, date);
      setPuzzleDate(date);
    }
  }, [initialDate, year, month, day]);

  useEffect(() => {
    if (puzzleDate) {
      console.log("About to fetch puzzle for date:", puzzleDate);
      fetchPuzzle(() => getDailyPuzzleForDate(puzzleDate))
        .then(puzzle => {
          if (!puzzle) {
            console.warn("No puzzle found for date:", puzzleDate);
            return;
          }
          console.log("Fetched puzzle for date:", puzzleDate, "Puzzle:", puzzle.slug);
          setCurrentPuzzle(puzzle);
          const formattedDateForPuzzle = shortDate(puzzleDate);
          setFormattedDate(formattedDateForPuzzle);
          console.log("Formatted date as: " + formattedDateForPuzzle);
        }).catch(error => console.error(`Failed to fetch daily puzzle for ${puzzleDate}:`, error));
    }
  }, [puzzleDate]);

  useEffect(() => {
    if (currentPuzzle && formattedDate && puzzleDate) {
      const previousLink = `/date/${dateLinkFormat(addDays(puzzleDate, -1))}`;
      const nextLink = `/date/${dateLinkFormat(addDays(puzzleDate, 1))}`;

      const content = (
        <h3 className="split-content">
          {<Link className="left-item" to={previousLink}>◀◀</Link>}
          <span className="date-item">{formattedDate}</span>
          {<Link className="right-item" to={nextLink}>▶▶</Link>}
        </h3>
      );

      setHeaderContent(content);
      const todayString = puzzleDate.getDate() == new Date().getDate() ? "today, " : "";
      setDateShareString(`I decoded the MAGiE puzzle for ${todayString}${formattedDate}!`);
    }
    return () => setHeaderContent(null); // Clear header when component unmounts

  }, [currentPuzzle, formattedDate, puzzleDate, setHeaderContent]);

  useEffect(() => {
    setSolveTimeDescription(`It took me ${solveTimeDisplay}.`)
  }, [solveTimeDisplay]);

  if (!puzzleDate) {
    return <>
      <p>What day is it???</p>
      <p>Tape loop misfeed.</p>
      <p>{linkToToday}</p>
    </>
  }

  const isFutureDate = puzzleDate > new Date();
  if (isFutureDate) {
    return <>
      <p>/// <span className="blink">Restricted</span> ///<br />{formattedDate}<br />//////////////////</p>
      <p>Please rewind.</p>
      {linkToToday}
    </>
  }

  if (!currentPuzzle) {
    return (
      <>
        <p>Tape missing.</p>
        <p>No puzzle found for<br />{formattedDate}.</p>
        {linkToToday}
      </>
    )
  }

  const updateSolveTime = (stopwatch: StopwatchHandle) => {
    if (stopwatch) {
      const h = stopwatch.getHours();
      const m = stopwatch.getMinutes();
      const s = stopwatch.getSeconds();

      let seconds = "seconds";
      if (s == 1) {
        seconds = "second";
      }
      let minutes = "minutes";
      if (m == 1) {
        minutes = "minute";
      }

      if (h > 0) {
        setSolveTimeDisplay(stopwatch.displayTime());
      } else if (m > 0) {
        setSolveTimeDisplay(`${m} ${minutes} and ${s} ${seconds}`);
      } else {
        setSolveTimeDisplay(`${s} ${seconds}`);
      }
    }
  };

  function handleWin(stopwatch: StopwatchHandle) {
    debug(`DatePlay handles win at ${ stopwatch.displayTime() }`);
    setHasWon(true);
    updateSolveTime(stopwatch);

    console.log(`Puzzle solved in ${solveTimeDisplay} s`);
    const eventParams = {
      puzzle_slug: currentPuzzle?.slug,
      winText: currentPuzzle?.winText,
      encoding: currentPuzzle?.encoding_name,
      encoding_type: currentPuzzle?.encoding.getType(),
      pagePath: window.location.pathname + window.location.search,
      solve_time_seconds: stopwatch.getTotalSeconds(),
    };

    ReactGA4.event("win", { ...eventParams });
  }

  const handleShareWin = () => {
    const shareText = `${dateShareString}\n${solveTimeDescription}`;

    // noinspection DuplicatedCode
    if (navigator.share) {
      navigator.share({
        title: "MAGiE binary puzzles",
        text: shareText,
        url: window.location.href,
      }).catch(console.error);
    } else if (navigator.clipboard) {
      const shareViaClipboard =
        'It seems that this browser does not support "Web Share".'
        + '\nShall we copy the share message to your clipboard?';
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

  return (
    <>
      {currentPuzzle && (
        <PlayPuzzle
          key={currentPuzzle.slug}
          puzzle={currentPuzzle}
          onWin={handleWin}
          puzzleShareString={`I decoded the MAGiE puzzle for ${puzzleDate.getDate() === new Date().getDate()
            ? "today, "
            : ""}${formattedDate}!`}
        />
      )}
      {hasWon && (<>
          <div className="after-win-controls">
            <button type={"button"} onClick={handleShareWin}>Share Your Win</button>
            <p className={"split-content"}>
              <Link
                to={`/date/${dateLinkFormat(addDays(puzzleDate, -1))}`}
                onClick={() => {
                  ReactGA4.event('story_start_clicked', {
                    source: 'post-win-link',
                    puzzle_slug: currentPuzzle?.slug,
                    is_first_visit: isFirstVisit,
                  });
                }}>
                ◀◀ Yesterday's puzzle
              </Link>
            </p>
          </div>
        </>
      )}
    </>
  );
};
