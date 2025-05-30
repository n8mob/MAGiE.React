import './App.css'
import { Route, Routes } from "react-router-dom";
import ReactGA4 from 'react-ga4';
import SpecificDaysPuzzle from "./components/SpecificDaysPuzzle.tsx";
import { usePageTracking } from "./hooks/usePageTracking.ts";
import { useEffect, useMemo, useState } from "react";
import Dialog from './components/Dialog.tsx';
import FirstTimeContent from './components/FirstTimeContent.tsx';
import SettingsContent from './components/SettingsContent.tsx';
import { useHeader } from "./hooks/useHeader.ts";

const ga4id = 'G-ZL5RKDBBF6';

ReactGA4.initialize(ga4id);

const urlParams = new URLSearchParams(window.location.search);
const debugMode = urlParams.has('debug') || urlParams.has('_dbg');

/**
 * Global declaration for gtag function
 * Not sure why 'Window' is marked as unused
 * other than the fact that 'window' uses a lowercase 'w' down below.
 * If I use a lowercase 'w' here, it will complain about 'gtag' not being defined.
 * And if I use an uppercase 'W' down there, I get the same complaint.
 */
declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

if (window.gtag) {
  if (debugMode) {
    window.gtag('config', ga4id, {'debug_mode': debugMode});
    console.log('Google Analytics 4 initialized with debug mode enabled.');
    ReactGA4.event("debug_mode_enabled", {debug_mode: debugMode});
  }
} else {
  console.warn('Google Analytics 4 is not available. Make sure you have included the GA4 script in your HTML.');
}

function App() {
  usePageTracking();
  const [hasSeenHowTo, setHasSeenHowTo] = useState(() => {
    const storedHasSeenHowTo = localStorage.getItem('hasSeenHowTo') === 'true';
    const storedSeenBefore = localStorage.getItem('seenBefore') === 'true';
    return storedHasSeenHowTo || storedSeenBefore;
  });

  const { headerContent } = useHeader();
  const [showHowTo, setShowHowTo] = useState(() => {
    return localStorage.getItem('hasSeenHowTo') !== 'true';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [useLcdFont, setUseLcdFont] = useState(() => {
    return localStorage.getItem('useLcdFont') === 'true';
  });

  useEffect(() => {
    localStorage.removeItem('seenBefore');
  }, []);

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

  const routes = useMemo(() => (
    <Routes>
      <Route path="/" element={<SpecificDaysPuzzle initialDate={new Date()}/>}/>
      <Route path="/today" element={<SpecificDaysPuzzle initialDate={new Date()}/>}/>
      <Route path="/date/:year/:month/:day" element={<SpecificDaysPuzzle/>}/>
    </Routes>), []);

  return (
    <>
      <div id="magie-header">
        <button aria-label={"open settings"} className="activate-dialog left" onClick={() => {
          setShowSettings(true);
          ReactGA4.event('open_settings_dialog', {
            source: 'activate_dialog',
            dialog: 'settings',
          });
        }}>
          ⋮
        </button>
        <button aria-label={"show how-to information"}
                className="activate-dialog right"
                onClick={() => {
                  setShowHowTo(true);
                  ReactGA4.event('open_help_dialog', {
                    source: 'activate_dialog',
                    dialog: 'help',
                    is_first_visit: localStorage.getItem('isFirstVisit') === 'true',
                  });
                }}>
          ?
        </button>

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
        {headerContent ?? <span>No header content</span>}
      </div>
      {routes}
    </>
  );
}

export default App;
