import {useParams} from "react-router-dom";
import {getDailyPuzzleForDate} from "../PuzzleApi.ts";
import DailyPuzzle from "./DailyPuzzle.tsx";
import {useEffect, useState} from "react";
import {FixedWidthEncodingData, Puzzle, VariableEncodingData} from "../Menu.ts";
import FixedWidthEncoder from "../encoding/FixedWidthEncoder.ts";
import VariableWidthEncoder from "../encoding/VariableWidthEncoder.ts";


const DateTest = () => {
  const {year, month, day} = useParams<{ year: string, month: string, day: string }>();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);

  useEffect(() => {
    if (!year || !month || !day) {
      return;
    }

    const fetchPuzzleForDate = async () => {
      try {
        const yearN = parseInt(year);
        const monthN = parseInt(month);
        const dayN = parseInt(day);

        const puzzleData = await getDailyPuzzleForDate(yearN, monthN, dayN);
        const puzzle: Puzzle = puzzleData.puzzle;
        let encodingData: FixedWidthEncodingData | VariableEncodingData;
        if (puzzleData.encoding.type == "fixed") {
          encodingData = puzzleData.encoding.encoding as FixedWidthEncodingData;
          puzzle.encoding = new FixedWidthEncoder(encodingData.encoding.width, encodingData.encoding.encodingMap);
        } else {
          encodingData = puzzleData.encoding as VariableEncodingData;
          puzzle.encoding = new VariableWidthEncoder(encodingData.encoding);
        }

        setPuzzle(puzzle);

      } catch (error) {
        console.error('Failed to fetch daily puzzle:', error);
      }
    };

    fetchPuzzleForDate().catch(error => console.error('Error fetching daily puzzle.', error));
  }, [year, month, day]);

  if (!puzzle) {
    return <h2>Loading...</h2>
  }

  return (
    <div>
      <h2>Date Test for {year}-{month}-{day}</h2>
      {puzzle && <DailyPuzzle puzzle={puzzle}/>}
    </div>
  );
};

export default DateTest;
