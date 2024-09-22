import {useEffect, useState} from "react";
import {Puzzle} from "../Menu.ts";
import fetchPuzzle from "../FetchPuzzle.tsx";
import {getDailyPuzzle} from "../PuzzleApi.ts";
import DailyPuzzle from "./DailyPuzzle.tsx";
import {Link} from "react-router-dom";

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

  return (
    <>
      <h3><Link to={"/yesterday"}>&lt;&nbsp;yesterday</Link></h3>
      <h3>&nbsp;&nbsp;today</h3>
      <DailyPuzzle puzzle={currentPuzzle} date={new Date()}/>
    </>
  );
};

export default TodaysPuzzle;
