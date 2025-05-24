// App.tsx
import './App.css'
import { Route, Routes } from "react-router-dom";
import ReactGA4 from 'react-ga4';
import FirstTimeOverlay from "./components/FirstTimeOverlay.tsx";
import SpecificDaysPuzzle from "./components/SpecificDaysPuzzle.tsx";
import { usePageTracking } from "./hooks/usePageTracking.ts";
import { useState } from "react";
import SettingsDialog from "./components/SettingsDialog.tsx";
import Dialog from './components/Dialog.tsx';

ReactGA4.initialize('G-ZL5RKDBBF6');

function App() {
  usePageTracking();
  const [showSettings, setShowSettings] = useState(false);
  const [showFirstTime, setShowFirstTime] = useState(true);

  return (
    <>
      {showFirstTime &&
        <Dialog onClose={() => setShowFirstTime(false)}>
          <FirstTimeOverlay />
        </Dialog>
      }
      {showSettings &&
        <Dialog onClose={() => setShowSettings(false)}>
          <SettingsDialog onClose={() => setShowSettings(false)}/>
        </Dialog>
      }

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
