import { Link, useParams } from "react-router-dom";
import { getDailyPuzzleForDate } from "../PuzzleApi.ts";
import { DailyPuzzle } from "./DailyPuzzle.tsx";
import { FC, useEffect, useState } from "react";
import { Puzzle } from "../Menu.ts";
import { fetchPuzzle } from "../FetchPuzzle.tsx";
import { useHeader } from "../hooks/useHeader.ts";


const addDays = (date: Date, days: number) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

const prettyOptions: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
};


const dateLinkFormat = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

type DayPuzzleProps = {
  initialDate?: Date;
}

const SpecificDaysPuzzle: FC<DayPuzzleProps> = ({initialDate}) => {
  const { setHeaderContent } = useHeader();
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [formattedDate, setFormattedDate] = useState("");


  const {year, month, day} = useParams<{ year?: string, month?: string, day?: string }>();
  const [puzzleDate, setPuzzleDate] = useState<Date | null>(null);
  const linkToToday = <Link to={"/today"}>Rewind to today</Link>;

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
          const formattedDateForPuzzle = puzzleDate.toLocaleDateString(navigator.language, prettyOptions);
          setFormattedDate(formattedDateForPuzzle);
          console.log("Formatted date as: " + formattedDateForPuzzle);
        }).catch(error => console.error(`Failed to fetch daily puzzle for ${puzzleDate}:`, error));
    }
  }, [puzzleDate]);

  useEffect(() => {
    if (currentPuzzle && formattedDate && puzzleDate) {
      const previousLink = `/date/${dateLinkFormat(addDays(puzzleDate, -1))}`;
      const nextLink = `/date/${dateLinkFormat(addDays(puzzleDate, 1))}`;

      console.log("Calculated previous link:", previousLink);
      console.log("About to set header content with formatted date:", formattedDate);
      console.log("Calculated next link:", nextLink);

      // 2. TODO use a callback or check something to make sure it isn't re-rendering unnecessarily.
      const content = (
        <h3 className="split-content">
          {<Link className="left-item" to={previousLink}>&lt;&lt;</Link>}
          <span className="date-item">{formattedDate}</span>
          {<Link className="right-item" to={nextLink}>&gt;&gt;</Link>}
        </h3>
      );

      setHeaderContent(content);
    }
    return () => setHeaderContent(null); // Clear header when component unmounts

  }, [currentPuzzle, formattedDate, puzzleDate, setHeaderContent]);

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
      <p>/// <span className="blink">Restricted</span> ///<br/>{formattedDate}<br/>//////////////////</p>
      <p>Please rewind.</p>
      {linkToToday}
    </>
  }

  if (!currentPuzzle) {
    return (
      <>
        <p>Tape missing.</p>
        <p>No puzzle found for<br/>{formattedDate}.</p>
        {linkToToday}
      </>
    )
  }

  return (
    <>
      {currentPuzzle && <DailyPuzzle puzzle={currentPuzzle} date={puzzleDate!} formattedDate={formattedDate}/>}
    </>
  );
};

export default SpecificDaysPuzzle;
