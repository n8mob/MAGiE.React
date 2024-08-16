import './App.css'
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import SpecificDaysPuzzle from "./components/SpecificDaysPuzzle.tsx";
import TodaysPuzzle from "./components/TodaysPuzzle.tsx";

function App() {
  return (
    <>
      <Router>
        <h1 id="magie-title">MAGiE</h1>
        <Routes>
          <Route path="/" element={<TodaysPuzzle />}/>
          <Route path="/test/:year/:month/:day" element={<SpecificDaysPuzzle />} />
        </Routes>
      </Router>
    </>
  )
}

export default App;
