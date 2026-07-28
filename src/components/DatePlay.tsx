import { Link, useParams } from "react-router-dom";
import { getDailyPuzzleForDate } from "../PuzzleApi.ts";
import { PlayPuzzle } from "./PlayPuzzle";
import { FC, useEffect, useMemo, useState } from "react";
import { Puzzle } from "../model.ts";
import { fetchPuzzle } from "../FetchPuzzle.tsx";
import { useHeader } from "../hooks/useHeader.ts";
import { shortDate } from "./DateFormatter.tsx";
import ReactGA4 from "react-ga4";
import { dailyPlacement } from "../analytics/puzzleAnalytics.ts";
import { usePageTitle } from "../hooks/usePageTitle.ts";
import { useActivationGuard } from "../hooks/useActivationGuard.ts";
import { dailyPuzzleTitle } from "../pageTitles.ts";
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
  const [puzzleStatus, setPuzzleStatus] = useState<"loading" | "ready" | "missing">("loading");
  const { year, month, day } = useParams<{ year?: string, month?: string, day?: string }>();
  const [solveTimeDisplay, setSolveTimeDisplay] = useState("");
  const [hasWon, setHasWon] = useState(false);
  const linkToToday = <Link to={"/today"}>Rewind to today</Link>;
  const isFirstVisit = !localStorage.getItem('isFirstVisit');

  const puzzleDate = useMemo<Date | null>(() => {
    if (initialDate) { return initialDate; }
    if (year && month && day) {
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return null;
  }, [initialDate, year, month, day]);

  const formattedDate = puzzleDate ? shortDate(puzzleDate) : '';
  const dateShareString = formattedDate
    ? `I decoded the MAGiE puzzle for ${puzzleDate?.getDate() === new Date().getDate() ? 'today, ' : ''}${formattedDate}!`
    : '';
  const solveTimeDescription = solveTimeDisplay ? `It took me ${solveTimeDisplay}.` : '';

  /*
   * Clear gameplay state during render rather than in an effect, matching
   * LevelPlay (#223).
   *
   * An effect happens to be safe here today: the async puzzle fetch nulls
   * currentPuzzle and unmounts PlayPuzzle, so the remount always lands after
   * this reset rather than before it. But that is an accident of timing, not a
   * guarantee — serving a cached puzzle synchronously would be enough to
   * reintroduce the bug, and it would look unrelated to whatever change caused
   * it. Resetting during render removes the dependency on that ordering.
   *
   * It also drops the commit where the previous puzzle's win controls are still
   * on screen, because neither effect has run yet.
   */
  // The date comes straight off the route, so unlike the menu areas this never
  // has to wait on a fetch.
  usePageTitle(puzzleDate ? dailyPuzzleTitle(puzzleDate) : null);

  const dateKey = puzzleDate ? dateLinkFormat(puzzleDate) : "";
  const [renderedDateKey, setRenderedDateKey] = useState(dateKey);
  if (dateKey !== renderedDateKey) {
    setRenderedDateKey(dateKey);
    setHasWon(false);
    setSolveTimeDisplay("");
  }

  useEffect(() => {
    if (!puzzleDate) { return; }
    let stale = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPuzzle(null);
    setPuzzleStatus("loading");
    fetchPuzzle(() => getDailyPuzzleForDate(puzzleDate))
      .then(puzzle => {
        if (stale) { return; }
        if (!puzzle) {
          console.warn("No puzzle found for date:", puzzleDate);
          setPuzzleStatus("missing");
          return;
        }
        setCurrentPuzzle(puzzle);
        setPuzzleStatus("ready");
      }).catch(error => {
        console.error(`Failed to fetch daily puzzle for ${puzzleDate}:`, error);
        if (!stale) {
          setPuzzleStatus("missing");
        }
      });
    return () => { stale = true; };
  }, [puzzleDate]);

  // Date navigation stays in the header even when the date has no puzzle,
  // so the player can keep paging to other days.
  useEffect(() => {
    if (formattedDate && puzzleDate) {

      const prevDate = dateLinkFormat(addDays(puzzleDate, -1));
      const nextDate = dateLinkFormat(addDays(puzzleDate, 1));

      const content = (
        <h3 className="split-content">
          {<Link className="left-item" to={`/date/${prevDate}`} onClick={() => ReactGA4.event('date_navigation', {
            direction: 'prev',
            target_date: prevDate,
          })}>◀◀</Link>}
          <span className="date-item">{formattedDate}</span>
          {<Link className="right-item" to={`/date/${nextDate}`} onClick={() => ReactGA4.event('date_navigation', {
            direction: 'next',
            target_date: nextDate,
          })}>▶▶</Link>}
        </h3>
      );

      setHeaderContent(content);
    }
    return () => setHeaderContent(null); // Clear header when component unmounts

  }, [formattedDate, puzzleDate, setHeaderContent]);

  const placement = useMemo(
    () => (currentPuzzle && puzzleDate) ? dailyPlacement(currentPuzzle, puzzleDate) : undefined,
    [currentPuzzle, puzzleDate]
  );

  /*
   * Both of these appear the moment the puzzle is solved, so the tap that solved
   * it must not carry through into them. handleShareWin is a hoisted function
   * declaration rather than a const arrow precisely so it can be referenced here,
   * above the early returns that hooks have to stay clear of.
   */
  const shareControl = useActivationGuard(handleShareWin);
  const yesterdayControl = useActivationGuard(() => {
    ReactGA4.event('story_start_clicked', {
      source: 'post-win-link',
      puzzle_slug: currentPuzzle?.slug,
      is_first_visit: isFirstVisit,
    });
  });

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

  if (puzzleStatus === "loading") {
    return <p>Rewinding the tape...</p>;
  }

  if (puzzleStatus === "missing" || !currentPuzzle) {
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
      if (s === 1) {
        seconds = "second";
      }
      let minutes = "minutes";
      if (m === 1) {
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

  // PlayPuzzle emits puzzle_end for the win; this only handles the local UI.
  function handleWin(stopwatch: StopwatchHandle) {
    debug(`DatePlay handles win at ${ stopwatch.displayTime() }`);
    setHasWon(true);
    updateSolveTime(stopwatch);
  }

  function handleShareWin() {
    const shareText = `${dateShareString}\n${solveTimeDescription}`;
    ReactGA4.event('share_win_clicked', {
      puzzle_slug: currentPuzzle?.slug,
    });

    // noinspection DuplicatedCode
    if (navigator.share) {
      navigator.share({
        title: "MAGiE binary puzzles",
        text: shareText,
        url: window.location.href,
      }).then(() => {
        ReactGA4.event('share_win_completed', {
          puzzle_slug: currentPuzzle?.slug,
          share_method: 'native',
        });
      }).catch(console.error);
    } else if (navigator.clipboard) {
      const shareViaClipboard =
        'It seems that this browser does not support "Web Share".'
        + '\nShall we copy the share message to your clipboard?';
      if (window.confirm(shareViaClipboard)) {
        navigator.clipboard.writeText(shareText)
          .then(() => {
            ReactGA4.event('share_win_completed', {
              puzzle_slug: currentPuzzle?.slug,
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
  }

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
          placement={placement}
        />
      )}
      {hasWon && (<>
          <div className="after-win-controls">
            <button type={"button"} {...shareControl}>Share Your Win</button>
            <p className={"split-content"}>
              <Link
                to={`/date/${dateLinkFormat(addDays(puzzleDate, -1))}`}
                {...yesterdayControl}>
                ◀◀ Yesterday's puzzle
              </Link>
            </p>
          </div>
        </>
      )}
    </>
  );
};
