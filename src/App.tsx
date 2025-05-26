import './App.css'
import { Route, Routes } from "react-router-dom";
import ReactGA4 from 'react-ga4';
import SpecificDaysPuzzle from "./components/SpecificDaysPuzzle.tsx";
import { usePageTracking } from "./hooks/usePageTracking.ts";
import { useEffect, useState } from "react";
import Dialog from './components/Dialog.tsx';
import FirstTimeContent from './components/FirstTimeContent.tsx';
import SettingsContent from './components/SettingsContent.tsx';

ReactGA4.initialize('G-ZL5RKDBBF6');

function App() {
  usePageTracking();
  const [hasSeenHowTo, setHasSeenHowTo] = useState(() => {
    return localStorage.getItem('hasSeenHowTo') === 'true';
  });
  const [showHowTo, setShowHowTo] = useState(() => {
    return localStorage.getItem('hasSeenHowTo') !== 'true';
  });

  const [showSettings, setShowSettings] = useState(false);
  const [useLcdFont, setUseLcdFont] = useState(() => {
    return localStorage.getItem('useLcdFont') === 'true';
  });

  useEffect(() => {
    document.body.style.fontFamily = useLcdFont
                                     ? '"HD44780", Menlo, Consolas, monospace'
                                     : '"Press Start 2P", Menlo, Consolas, monospace';
  }, [useLcdFont]);

  useEffect(() => {
    const isFirstVisit = !localStorage.getItem('isFirstVisit');
    const hasSeenHowTo = localStorage.getItem('hasSeenHowTo') === 'true';
    if (isFirstVisit || !hasSeenHowTo) {
      setShowHowTo(true)
      localStorage.setItem('isFirstVisit', 'false');
      // TODO fire analytics event for first visit
    }
  }, [hasSeenHowTo, showHowTo]);

  return (
    <>
      <button className="activate-dialog left" onClick={() => setShowSettings(true)}>⋮</button>
      <button className="activate-dialog right" onClick={() => setShowHowTo(true)}>?</button>

      {showHowTo && (<Dialog onClose={() => {
          setHasSeenHowTo(true);
          localStorage.setItem('hasSeenHowTo', 'true');
          setShowHowTo(false);
      }}>
          <FirstTimeContent/>
        </Dialog>
      )}

      {showSettings && (
        <Dialog onClose={() => setShowSettings(false)}>
          <SettingsContent useLcdFont={useLcdFont} setUseLcdFont={setUseLcdFont}/>
        </Dialog>
      )}

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
