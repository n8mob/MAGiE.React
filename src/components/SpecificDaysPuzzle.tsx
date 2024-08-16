import {useParams} from "react-router-dom";
import {getDailyPuzzleForDate} from "../PuzzleApi.ts";
import DailyPuzzle from "./DailyPuzzle.tsx";
import {useEffect, useState} from "react";
import {Puzzle} from "../Menu.ts";
import fetchPuzzle from "../FetchPuzzle.tsx";

const SpecificDaysPuzzle = () => {
  const {year, month, day} = useParams<{ year: string, month: string, day: string }>();
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [puzzleDate, setPuzzleDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!year || !month || !day) {
      const today = new Date();
      setPuzzleDate(today);
    } else {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      setPuzzleDate(date);
    }
  }, [year, month, day]);

  useEffect(() => {
    if (puzzleDate) {
      fetchPuzzle(() => getDailyPuzzleForDate(puzzleDate))
        .then(puzzle => setCurrentPuzzle(puzzle))
        .catch(error => console.error(`Failed to fetch daily puzzle for ${puzzleDate}:`, error));
    }
  }, [puzzleDate]);

  if (!currentPuzzle) {
    return <h2>Loading...</h2>
  }

  return (
    <>
      <h2>Date Test</h2>
        {currentPuzzle && <DailyPuzzle puzzle={currentPuzzle} date={puzzleDate!}/>}
    </>
  );
};

export default SpecificDaysPuzzle;
