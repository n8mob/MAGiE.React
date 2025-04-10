import {Link, useParams} from "react-router-dom";
import {getDailyPuzzleForDate} from "../PuzzleApi.ts";
import DailyPuzzle from "./DailyPuzzle.tsx";
import React, {useEffect, useState} from "react";
import {Puzzle} from "../Menu.ts";
import fetchPuzzle from "../FetchPuzzle.tsx";

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

const SpecificDaysPuzzle: React.FC<DayPuzzleProps> = ({initialDate}) => {
  const {year, month, day} = useParams<{ year?: string, month?: string, day?: string }>();
  const [puzzleDate, setPuzzleDate] = useState<Date | null>(null);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [formattedDate, setFormattedDate] = useState("");
  const prettyOptions: Intl.DateTimeFormatOptions = {weekday: 'short', month: 'short', day: 'numeric'};
  const linkToToday = <Link to={"/today"}>Go to today's puzzle</Link>;

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
      setFormattedDate(puzzleDate.toLocaleDateString(userLocale, prettyOptions));

      fetchPuzzle(() => getDailyPuzzleForDate(puzzleDate))
        .then(puzzle => {
          if (puzzle) {
            setCurrentPuzzle(puzzle);
          } else {
            console.warn("No puzzle for date", puzzleDate);
          }
        })
        .catch(error => console.error(`Failed to fetch daily puzzle for ${puzzleDate}:`, error));
    }
  }, [puzzleDate]);

  if (!puzzleDate) {
    return <>
      <p>What day is it???</p>
      <p>Tape loop misfeed.</p>
      {linkToToday}
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
      <h3 className="split-content">
        {<Link className="right-item" to={"/test/" + dateLinkFormat(addDays(puzzleDate, -1))}>&lt;&lt;</Link>}
        <span className="date-item">{formattedDate}</span>
        {<Link className="right-item" to={"/test/" + dateLinkFormat(addDays(puzzleDate, 1))}>&gt;&gt;</Link>}
      </h3>
      {currentPuzzle && <DailyPuzzle puzzle={currentPuzzle} date={puzzleDate!} formattedDate={formattedDate}/>}
    </>
  );
};

export default SpecificDaysPuzzle;
