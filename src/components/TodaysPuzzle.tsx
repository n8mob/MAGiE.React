import {useEffect, useState} from "react";
import {Puzzle} from "../Menu.ts";
import fetchPuzzle from "../FetchPuzzle.tsx";
import {getDailyPuzzle} from "../PuzzleApi.ts";
import DailyPuzzle from "./DailyPuzzle.tsx";

const TodaysPuzzle = () => {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle>();

  useEffect(() => {
    fetchPuzzle(getDailyPuzzle)
      .then(puzzle => setCurrentPuzzle(puzzle))
      .catch(error => console.error('Failed to fetch daily puzzle:', error));
  }, []);

  if (!currentPuzzle) {
    return <div>Loading...</div>;
  }

  const todaysDate = new Date();

  return (
    <>
      <DailyPuzzle puzzle={currentPuzzle} date={todaysDate} formattedDate={todaysDate.toLocaleDateString()}/>
    </>
  );
};

export default TodaysPuzzle;
