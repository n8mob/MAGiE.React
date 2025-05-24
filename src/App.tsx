import './App.css'
import { Route, Routes } from "react-router-dom";
import ReactGA4 from 'react-ga4';
import SpecificDaysPuzzle from "./components/SpecificDaysPuzzle.tsx";
import { usePageTracking } from "./hooks/usePageTracking.ts";
import { useState } from "react";
import Dialog from './components/Dialog.tsx';
import FirstTimeContent from './components/FirstTimeContent.tsx';
import SettingsContent from './components/SettingsContent.tsx';

ReactGA4.initialize('G-ZL5RKDBBF6');

function App() {
  usePageTracking();
  const [showSettings, setShowSettings] = useState(false);
  const [showFirstTime, setShowFirstTime] = useState(true);

  return (
    <>
      {showFirstTime && (
        <Dialog onClose={() => setShowFirstTime(false)}>
          <FirstTimeContent />
        </Dialog>
      )}
      {showSettings && (
        <Dialog onClose={() => setShowSettings(false)}>
          <SettingsContent/>
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
