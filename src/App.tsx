import './App.css'
import {Route, Routes} from "react-router-dom";
import ReactGA4 from 'react-ga4';
import FirstTimeOverlay from "./components/FirstTimeOverlay.tsx";
import SpecificDaysPuzzle from "./components/SpecificDaysPuzzle.tsx";
import {usePageTracking} from "./hooks/usePageTracking.ts";
import {useState} from "react";

ReactGA4.initialize('G-ZL5RKDBBF6');

function App() {
  usePageTracking();
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  return (
    <>
      {!overlayDismissed && <FirstTimeOverlay onClose={() => setOverlayDismissed(true)}/>}
      <h1 id="magie-title">MAGiE</h1>
      <Routes>
        <Route path="/" element={<SpecificDaysPuzzle initialDate={new Date()}/>}/>
        <Route path="/today" element={<SpecificDaysPuzzle initialDate={new Date()}/>}/>
        <Route path="/date/:year/:month/:day" element={<SpecificDaysPuzzle/>}/>
      </Routes>
    </>
  );
}

export default App;
