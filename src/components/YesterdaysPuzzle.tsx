import {useEffect, useState} from "react";
import {Puzzle} from "../Menu.ts";
import fetchPuzzle from "../FetchPuzzle.tsx";
import {getDailyPuzzleForDate} from "../PuzzleApi.ts";
import DailyPuzzle from "./DailyPuzzle.tsx";
import {Link} from "react-router-dom";

const YesterdaysPuzzle = () => {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [puzzleDate, setPuzzleDate] = useState<Date | null>(null);

  useEffect(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setPuzzleDate(yesterday);
  }, []);

  useEffect(() => {
    if (puzzleDate) {
      fetchPuzzle(() => getDailyPuzzleForDate(puzzleDate))
        .then(puzzle => setCurrentPuzzle(puzzle))
        .catch(error => console.error(`Failed to fetch daily puzzle for ${puzzleDate}:`, error));
    }
  }, [puzzleDate]);

  if (!currentPuzzle) {
    return <div>Loading yesterday's puzzle...</div>;
  }

  return (
    <>
      <h3><Link to={"/today"}>&nbsp;&nbsp;today&nbsp;&nbsp;&gt;</Link></h3>
      <h3>&nbsp;&nbsp;yesterday</h3>
      <DailyPuzzle puzzle={currentPuzzle} date={puzzleDate!}/>
    </>
  );
};

export default YesterdaysPuzzle;
