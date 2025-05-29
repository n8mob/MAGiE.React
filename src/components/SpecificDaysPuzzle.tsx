import {Link, useParams} from "react-router-dom";
import {getDailyPuzzleForDate} from "../PuzzleApi.ts";
import DailyPuzzle from "./DailyPuzzle.tsx";
import { FC, ReactNode, useEffect, useState } from "react";
import {Puzzle} from "../Menu.ts";
import { fetchPuzzle } from "../FetchPuzzle.tsx";

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
  setDynamicHeader: (dynamicHeaderContent: ReactNode) => void;
}

const SpecificDaysPuzzle: FC<DayPuzzleProps> = ({initialDate, setDynamicHeader}) => {
  const {year, month, day} = useParams<{ year?: string, month?: string, day?: string }>();
  const [puzzleDate, setPuzzleDate] = useState<Date | null>(null);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [formattedDate, setFormattedDate] = useState("");
  const linkToToday = <Link to={"/today"}>Rewind to today</Link>;

  useEffect(() => {
    if (initialDate) {
      setPuzzleDate(initialDate);
    } else if (year && month && day) {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      setPuzzleDate(date);
    }
  }, [initialDate, year, month, day]);

  useEffect(() => {
    if (puzzleDate) {
      setCurrentPuzzle(null);
      setFormattedDate("");
      const userLocale = navigator.language;
      const formattedDateForPuzzle = puzzleDate.toLocaleDateString(userLocale, prettyOptions);

      fetchPuzzle(() => getDailyPuzzleForDate(puzzleDate))
        .then(puzzle => {
          if (puzzle) {
            setCurrentPuzzle(puzzle);
          } else {
            console.warn("No puzzle for date", puzzleDate);
          }
        })
        .catch(error => console.error(`Failed to fetch daily puzzle for ${puzzleDate}:`, error));

      console.log("Formatting puzzle date as: " + formattedDateForPuzzle);
      setFormattedDate(formattedDateForPuzzle);

      const previousLink = `/date/${dateLinkFormat(addDays(puzzleDate, -1))}`;
      const nextLink = `/date/${dateLinkFormat(addDays(puzzleDate, 1))}`;

      setDynamicHeader(
        <h3 className="split-content">
          {<Link className="right-item" to={previousLink}>&lt;&lt;</Link>}
          <span className="date-item">{formattedDateForPuzzle}</span>
          {<Link className="right-item" to={nextLink}>&gt;&gt;</Link>}
        </h3>
      );

    }

    return () => setDynamicHeader(null); // Clear header when component unmounts
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
