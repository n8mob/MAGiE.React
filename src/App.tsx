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
import { MenuBrowser } from './components/MenuBrowser.tsx';
import { CategoryBrowser } from './components/CategoryBrowser.tsx';
import LevelPlay from "./components/LevelPlay.tsx";
import { PageNotFound } from "./components/PageNotFound.tsx";
import { LevelBrowser } from "./components/LevelBrowser.tsx";
import { getFeatureFlagsFromURL } from "./FeatureFlags.ts";
import { getOrCreateSessionChallenge } from "./SessionChallenge.ts";

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
  getOrCreateSessionChallenge();
  const {headerContent} = useHeader();

  const [hasSeenHowTo, setHasSeenHowTo] = useState(() => {
    const storedHasSeenHowTo = localStorage.getItem('hasSeenHowTo') === 'true';
    const storedSeenBefore = localStorage.getItem('seenBefore') === 'true';
    return storedHasSeenHowTo || storedSeenBefore;
  });
  const [showHowTo, setShowHowTo] = useState(() => localStorage.getItem('hasSeenHowTo') !== 'true');
  const [showSettings, setShowSettings] = useState(false);
  const [useLcdFont, setUseLcdFont] = useState(() => localStorage.getItem('useLcdFont') === 'true');
  const [features, setFeatures] = useState<string[]>([]);

  useEffect(() => localStorage.removeItem('seenBefore'), []);

  useEffect(() => {
    const initialRetries = 6;

    function checkAndSetFeatures(retries = initialRetries, delay_ms = 200) {
      if (!window.crypto?.subtle) {
        console.warn(`${retries}. Web Crypto library not ready yet.`);
        if (retries > 0) {
          setTimeout(() => checkAndSetFeatures(retries - 1, delay_ms), delay_ms);
        } else {
          console.warn(`Gave up after ${initialRetries} retries.`);
        }
        return;
      }

      console.log('Web Crypto library is ready...');

      getFeatureFlagsFromURL()
        .then(setFeatures)
        .catch(console.error);
    }

    checkAndSetFeatures(initialRetries, 100);
  }, []);

  useEffect(() => {
    document.body.style.fontFamily = useLcdFont
      ? '"HD44780", Menlo, Consolas, monospace'
      : '"Press Start 2P", Menlo, Consolas, monospace';
  }, [useLcdFont]);

  useEffect(() => {
    const isFirstVisit = !localStorage.getItem('isFirstVisit');
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
      {features.includes("storyRoutes") && (<>
        <Route path="/mall" element={<MenuBrowser menuName="mall"/>}/>
        <Route path="/mall/:categoryIndex" element={<CategoryBrowser menuName="mall"/>}/>
        <Route path="/mall/:categoryIndex/levels/:levelNumber" element={<LevelBrowser menuName="mall"/>}/>
        <Route path="/mall/:categoryIndex/levels/:levelNumber/puzzles/:puzzleIndex"
               element={<LevelPlay menuName="mall"/>}/>
      </>)}
      {features.includes('tutorialRoutes') && (<>
        <Route path="/tutorial" element={<MenuBrowser menuName="tutorial"/>}/>
        <Route path="/tutorial/:categoryIndex" element={<CategoryBrowser menuName="tutorial"/>}/>
        <Route path="/tutorial/:categoryIndex/levels/:levelNumber" element={<LevelBrowser menuName="tutorial"/>}/>
        <Route path="/tutorial/:categoryIndex/levels/:levelNumber/puzzles/:puzzleIndex"
               element={<LevelPlay menuName="tutorial"/>}/>
      </>)}
      {features.includes('bigGameRoutes') && (<>
        <Route path="/bigGame" element={<MenuBrowser menuName="bigGame"/>}/>
        <Route path="/bigGame/:categoryIndex" element={<CategoryBrowser menuName="bigGame"/>}/>
        <Route path="/bigGame/:categoryIndex/levels/:levelNumber" element={<LevelBrowser menuName="bigGame"/>}/>
        <Route path="/bigGame/:categoryIndex/levels/:levelNumber/puzzles/:puzzleIndex"
               element={<LevelPlay menuName="bigGame"/>}/>
      </>)}
      <Route path={"*"} element={<PageNotFound/>}/>
    </Routes>), [features]);

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
