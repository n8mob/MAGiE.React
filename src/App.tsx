import './App.css'
import {useEffect, useState} from "react";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import {getDailyPuzzle} from "./PuzzleApi.ts";
import DailyPuzzle from "./components/DailyPuzzle.tsx";
import {FixedWidthEncodingData, Puzzle, VariableEncodingData} from "./Menu.ts";
import FixedWidthEncoder from "./encoding/FixedWidthEncoder.ts";
import VariableWidthEncoder from "./encoding/VariableWidthEncoder.ts";
import DateTest from "./components/DateTest.tsx";

function App() {
  const [dailyPuzzle, setDailyPuzzle] = useState<Puzzle | null>(null);

  useEffect(() => {
    const fetchDailyPuzzle = async () => {
      try {
        const puzzleData = await getDailyPuzzle();
        const puzzle: Puzzle = puzzleData.puzzle;
        let encodingData: FixedWidthEncodingData | VariableEncodingData;
        if (puzzleData.encoding.type == "fixed") {
          encodingData = puzzleData.encoding.encoding as FixedWidthEncodingData;
          puzzle.encoding = new FixedWidthEncoder(encodingData.encoding.width, encodingData.encoding.encodingMap);
        } else {
          encodingData = puzzleData.encoding as VariableEncodingData;
          puzzle.encoding = new VariableWidthEncoder(encodingData.encoding);
        }

        setDailyPuzzle(puzzle);
      } catch (error) {
        console.error('Failed to fetch menu data:', error)
        return <h2>Error</h2>
      }
    };

    fetchDailyPuzzle().catch(error => console.error('Error fetching menu data.', error));
  }, []);

  return (
    <>
      <Router>
        <h1>MAGiE</h1>
        <Routes>
          <Route path="/" element={
            <>
              {dailyPuzzle && <DailyPuzzle puzzle={dailyPuzzle}/>}
            </>
          }/>
          <Route path="/test/:year/:month/:day" element={<DateTest />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
