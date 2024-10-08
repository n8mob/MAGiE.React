import './App.css'
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import ReactGA4 from 'react-ga4';
import SpecificDaysPuzzle from "./components/SpecificDaysPuzzle.tsx";
import TodaysPuzzle from "./components/TodaysPuzzle.tsx";
import YesterdaysPuzzle from "./components/YesterdaysPuzzle.tsx";


function App() {
  ReactGA4.initialize('G-ZL5RKDBBF6');
  const page_path = window.location.pathname + window.location.search;
  ReactGA4.send({
    hitType: "pageview",
    page: page_path,
  });

  return (
    <>
      <Router>
        <h1 id="magie-title">MAGiE</h1>
        <Routes>
          <Route path="/" element={<TodaysPuzzle/>}/>
          <Route path="/today" element={<TodaysPuzzle/>}/>
          <Route path="/test/:year/:month/:day" element={<SpecificDaysPuzzle/>}/>
          <Route path="/yesterday" element={<YesterdaysPuzzle/>}/>
        </Routes>
      </Router>
    </>
  )
}

export default App;
