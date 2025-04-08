import './App.css'
import {Route, Routes} from "react-router-dom";
import ReactGA4 from 'react-ga4';
import SpecificDaysPuzzle from "./components/SpecificDaysPuzzle.tsx";
import TodaysPuzzle from "./components/TodaysPuzzle.tsx";
import YesterdaysPuzzle from "./components/YesterdaysPuzzle.tsx";
import {usePageTracking} from "./hooks/usePageTracking.ts";

ReactGA4.initialize('G-ZL5RKDBBF6');

function App() {
  usePageTracking();

  return (
    <>
      <h1 id="magie-title">MAGiE</h1>
      <Routes>
        <Route path="/" element={<SpecificDaysPuzzle initialDate={new Date()} />}/>
        <Route path="/today" element={<SpecificDaysPuzzle initialDate={new Date()} />}/>
        <Route path="/old_today" element={<TodaysPuzzle/>}/>
        <Route path="/test/:year/:month/:day" element={<SpecificDaysPuzzle/>}/>
        <Route path="/old_yesterday" element={<YesterdaysPuzzle/>}/>
      </Routes>
    </>
  )
}

export default App;
