import './App.css'
import scrollCover from './assets/ScrollCover.png'
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import ReactGA4 from 'react-ga4';
import { DatePlay } from "./components/DatePlay.tsx";
import { usePageTracking } from "./hooks/usePageTracking.ts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Dialog from './components/Dialog.tsx';
import HowTo from './components/HowTo.tsx';
import WelcomeContent from './components/WelcomeContent.tsx';
import SettingsContent from './components/SettingsContent.tsx';
import { useHeader } from "./hooks/useHeader.ts";
import { MenuBrowser } from './components/MenuBrowser.tsx';
import { CategoryBrowser } from './components/CategoryBrowser.tsx';
import LevelPlay from "./components/LevelPlay.tsx";
import { PageNotFound } from "./components/PageNotFound.tsx";
import { LevelBrowser } from "./components/LevelBrowser.tsx";
import { useFeatureFlags } from "./hooks/useFeatureFlags.ts";
import { StoryPage } from "./components/StoryPage.tsx";
import { StoryIndex } from "./components/StoryIndex.tsx";
import { DoorLock } from "./components/DoorLock.tsx";
import { TouchDiagnostics } from "./components/TouchDiagnostics.tsx";
import { VariableWidthEncoder } from "./encoding/VariableWidthEncoder.ts";

const doorLockEncoder = new VariableWidthEncoder({ "0": { "a": "0" }, "1": { "b": "1" } });

const ga4id = 'G-ZL5RKDBBF6';
const HEADER_EXPAND_GESTURE_DELTA = 44;

const urlParams = new URLSearchParams(window.location.search);
const debugMode = import.meta.env.VITE_GA_DEBUG === 'true' || urlParams.has('_dbg');

/*
 * send_page_view is off because usePageTracking sends a page_view on every route
 * change — including the first one. Left on, gtag's own config-time page_view
 * would double-count every landing.
 *
 * debug_mode rides along on the same config call. Setting it via a second
 * gtag('config', ...) would fire yet another page_view, and would leave any
 * event sent before that second call untagged.
 */
ReactGA4.initialize(ga4id, {
  gtagOptions: {
    send_page_view: false,
    ...(debugMode ? { debug_mode: true } : {}),
  },
});

if (debugMode) {
  console.log('Google Analytics 4 initialized with debug mode enabled.');
  ReactGA4.event("debug_mode_enabled", { debug_mode: debugMode });
}

function RedirectLevelRootToPuzzle0() {
  const { categoryIndex, levelNumber } = useParams();
  return <Navigate to={`/tutorial/${categoryIndex}/levels/${levelNumber}/puzzles/0`} replace={true} />;
}

function App() {
  usePageTracking();
  const { headerContent, stopwatchDisplay } = useHeader();
  // Temporary, for issue #186. Read straight off the URL so it survives routing.
  const showTouchDiagnostics = new URLSearchParams(window.location.search).get("diag") === "touch";

  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem('isFirstVisit') === null);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [useLcdFont, setUseLcdFont] = useState(() => (localStorage.getItem('useLcdFont') || 'true') === 'true');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const routeContentRef = useRef<HTMLDivElement | null>(null);
  const activeScrollContainer = useRef<HTMLElement | null>(null);
  const wheelExpandAccumulator = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const features = useFeatureFlags();

  useEffect(() => localStorage.removeItem('seenBefore'), []);

  useEffect(() => {
    if (showWelcome) {
      ReactGA4.event('welcome_dialog_shown', { source: 'first_visit' });
    }
  }, [showWelcome]);

  useEffect(() => {
    document.body.style.fontFamily = useLcdFont
      ? '"HD44780", Menlo, Consolas, monospace'
      : '"Press Start 2P", Menlo, Consolas, monospace';
  }, [useLcdFont]);

  useEffect(() => {
    const routeContent = routeContentRef.current;
    if (!routeContent) {
      return;
    }

    const handleNestedScroll = (event: Event) => {
      const scrollTarget = event.target;
      if (!(scrollTarget instanceof HTMLElement)) {
        return;
      }

      if (scrollTarget !== routeContent && !routeContent.contains(scrollTarget)) {
        return;
      }

      activeScrollContainer.current = scrollTarget;
    };

    routeContent.addEventListener('scroll', handleNestedScroll, true);
    return () => routeContent.removeEventListener('scroll', handleNestedScroll, true);
  }, []);

  const getScrollContainerFromEventTarget = useCallback((target: EventTarget | null): HTMLElement | null => {
    const routeContent = routeContentRef.current;
    if (!routeContent) {
      return null;
    }

    if (!(target instanceof HTMLElement)) {
      return routeContent;
    }

    if (!routeContent.contains(target)) {
      return routeContent;
    }

    let node: HTMLElement | null = target;
    while (node && node !== routeContent) {
      if (node.scrollHeight > node.clientHeight) {
        return node;
      }
      node = node.parentElement;
    }

    return routeContent;
  }, []);

  useEffect(() => {
    const routeContent = routeContentRef.current;
    if (!routeContent) {
      return;
    }

    const resetGestureTracking = () => {
      wheelExpandAccumulator.current = 0;
      touchStartY.current = null;
    };

    const maybeExpandFromPullDown = (scrollContainer: HTMLElement, pullDistance: number) => {
      if (!isHeaderCollapsed) {
        return;
      }

      if (scrollContainer.scrollTop > 0) {
        wheelExpandAccumulator.current = 0;
        return;
      }

      wheelExpandAccumulator.current += pullDistance;
      if (wheelExpandAccumulator.current >= HEADER_EXPAND_GESTURE_DELTA) {
        setIsHeaderCollapsed(false);
        wheelExpandAccumulator.current = 0;
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (!isHeaderCollapsed) {
        return;
      }

      const scrollContainer = getScrollContainerFromEventTarget(event.target);
      if (!scrollContainer) {
        return;
      }

      if (event.deltaY < 0) {
        maybeExpandFromPullDown(scrollContainer, -event.deltaY);
      } else {
        wheelExpandAccumulator.current = 0;
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length < 1) {
        return;
      }
      touchStartY.current = event.touches[0].clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!isHeaderCollapsed || event.touches.length < 1 || touchStartY.current === null) {
        return;
      }

      const scrollContainer = getScrollContainerFromEventTarget(event.target);
      if (!scrollContainer || scrollContainer.scrollTop > 0) {
        wheelExpandAccumulator.current = 0;
        return;
      }

      const currentTouchY = event.touches[0].clientY;
      const pullDistance = currentTouchY - touchStartY.current;
      if (pullDistance <= 0) {
        return;
      }

      maybeExpandFromPullDown(scrollContainer, pullDistance);
      touchStartY.current = currentTouchY;
    };

    routeContent.addEventListener('wheel', handleWheel, { capture: true, passive: true });
    routeContent.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    routeContent.addEventListener('touchmove', handleTouchMove, { capture: true, passive: true });
    routeContent.addEventListener('touchend', resetGestureTracking, { capture: true, passive: true });
    routeContent.addEventListener('touchcancel', resetGestureTracking, { capture: true, passive: true });

    return () => {
      routeContent.removeEventListener('wheel', handleWheel, true);
      routeContent.removeEventListener('touchstart', handleTouchStart, true);
      routeContent.removeEventListener('touchmove', handleTouchMove, true);
      routeContent.removeEventListener('touchend', resetGestureTracking, true);
      routeContent.removeEventListener('touchcancel', resetGestureTracking, true);
    };
  }, [getScrollContainerFromEventTarget, isHeaderCollapsed]);

  const expandHeader = useCallback(() => {
    setIsHeaderCollapsed(false);
    wheelExpandAccumulator.current = 0;
    touchStartY.current = null;
    const scrollContainer = activeScrollContainer.current ?? routeContentRef.current;
    if (!scrollContainer) {
      return;
    }
    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const routes = useMemo(() => (
    <Routes>
      <Route path="/" element={<Navigate to={"/tutorial"} replace={true} />} />
      {features.includes('date') && (<>
        <Route path="/today" element={<DatePlay initialDate={new Date()} />} />
        <Route path="/date/:year/:month/:day" element={<DatePlay />} />
      </>)}
      {features.includes('story') && (<>
        <Route path="/story" element={<StoryIndex />} />
        <Route path="/story/:slug" element={<StoryPage />} />
      </>)}
      {features.includes('doorLock') && (<>
        <Route path="/doorLock" element={<DoorLock encoder={doorLockEncoder} presets={["1", "10", "11"]} />} />
      </>)}
      {features.includes('tutorial') && (<>
        <Route path="/tutorial" element={<MenuBrowser menuName="tutorial" />} />
        <Route path="/tutorial/:categoryIndex" element={<CategoryBrowser menuName="tutorial" />} />
        <Route path="/tutorial/:categoryIndex/levels/:levelNumber" element={
          <RedirectLevelRootToPuzzle0 />
        } />
        <Route path="/tutorial/:categoryIndex/levels/:levelNumber/puzzles/:puzzleIndex"
               element={<LevelPlay menuName="tutorial" />} />
      </>)}
      {features.includes('vintage') && (<>
        <Route path="/vintage" element={<MenuBrowser menuName="vintage" />} />
        <Route path="/vintage/:categoryIndex" element={<CategoryBrowser menuName="vintage" />} />
        <Route path="/vintage/:categoryIndex/levels/:levelNumber" element={<LevelBrowser menuName="vintage" />} />
        <Route path="/vintage/:categoryIndex/levels/:levelNumber/puzzles/:puzzleIndex"
               element={<LevelPlay menuName="vintage" />} />
      </>)}
      {features.includes('bigGameRoutes') && (<>
        <Route path="/bigGame" element={<MenuBrowser menuName="bigGame" />} />
        <Route path="/bigGame/:categoryIndex" element={<CategoryBrowser menuName="bigGame" />} />
        <Route path="/bigGame/:categoryIndex/levels/:levelNumber" element={<LevelBrowser menuName="bigGame" />} />
        <Route path="/bigGame/:categoryIndex/levels/:levelNumber/puzzles/:puzzleIndex"
               element={<LevelPlay menuName="bigGame" />} />
      </>)}
      <Route path="/chocolate2" element={<MenuBrowser menuName="chocolate2" />} />
      <Route path="/chocolate2/:categoryIndex" element={<CategoryBrowser menuName="chocolate2" />} />
      <Route path="/chocolate2/:categoryIndex/levels/:levelNumber" element={<LevelBrowser menuName="chocolate2" />} />
      <Route path="/chocolate2/:categoryIndex/levels/:levelNumber/puzzles/:puzzleIndex"
             element={<LevelPlay menuName="chocolate2" />} />
      {features.includes('chocolate') && (<>
        {/* MENU_NAME_MAP aliases "chocolate" to the mall's API menu, so these
            routes browse mall content while links stay under /chocolate. */}
        <Route path="/letErRoll" element={<Navigate to={"/chocolate/0/levels/4/puzzles/0"}/>} />
        <Route path="/chocolate" element={<MenuBrowser menuName="chocolate" />} />
        <Route path="/chocolate/:categoryIndex" element={<CategoryBrowser menuName="chocolate" />} />
        <Route path="/chocolate/:categoryIndex/levels/:levelNumber" element={<LevelBrowser menuName="chocolate" />} />
        <Route path="/chocolate/:categoryIndex/levels/:levelNumber/puzzles/:puzzleIndex"
               element={<LevelPlay menuName="chocolate" asChocolate={true} />} />
      </>)}
      {features.includes('mall') && (<>
        <Route path="/mall" element={<MenuBrowser menuName="mall" />} />
        <Route path="/mall/:categoryIndex" element={<CategoryBrowser menuName="mall" />} />
        <Route path="/mall/:categoryIndex/levels/:levelNumber" element={<LevelBrowser menuName="mall" />} />
        <Route path="/mall/:categoryIndex/levels/:levelNumber/puzzles/:puzzleIndex"
               element={<LevelPlay menuName="mall" />} />
      </>)}
      <Route path={"*"} element={<PageNotFound />} />
    </Routes>), [features]);

  return (
    <div id="device">
      {showTouchDiagnostics && <TouchDiagnostics />}
      <div id="bezel-header">
        <img src={scrollCover} alt="" style={{ width: '100%', display: 'block' }} />
        <h1 id="magie-title">MAGiE</h1>
        <button type={"button"} aria-label={"open settings"} className="symbol-button activate-dialog left" onClick={() => {
          setShowSettings(true);
          ReactGA4.event('open_settings_dialog', {
            source: 'activate_dialog',
            dialog: 'settings',
          });
        }}>Aa
        </button>
        <button type={"button"}
                aria-label={"show how-to information"}
                className="symbol-button activate-dialog right"
                onClick={() => {
                  setShowHowTo(true);
                  ReactGA4.event('open_help_dialog', {
                    source: 'activate_dialog',
                    dialog: 'help',
                    is_first_visit: localStorage.getItem('isFirstVisit') === null,
                  });
                }}>?
        </button>

        {showWelcome && (
          <Dialog onClose={() => {
            localStorage.setItem('isFirstVisit', 'visited');
            setShowWelcome(false);
            ReactGA4.event('welcome_dialog_dismissed');
          }}>
            <WelcomeContent />
          </Dialog>
        )}

        {showHowTo && (
          <Dialog onClose={() => setShowHowTo(false)}>
            <HowTo />
          </Dialog>
        )}

        {showSettings && (
          <Dialog onClose={() => setShowSettings(false)}>
            <SettingsContent useLcdFont={useLcdFont}
                             setUseLcdFont={setUseLcdFont} />
          </Dialog>
        )}
      </div>
      <div className={`display-frame ${isHeaderCollapsed ? "header-collapsed" : ""}`}>
        <div id="magie-header" className={isHeaderCollapsed ? "collapsed" : ""}>
          {headerContent && (
            <div id="magie-header-full" aria-hidden={isHeaderCollapsed}>
              {headerContent ?? <span>No header content</span>}
            </div>
          )}

          {headerContent && (
            <div id="magie-header-compact">
              <span id="magie-header-stopwatch">{stopwatchDisplay}</span>
              <button
                type="button"
                id="magie-header-expand"
                aria-label="expand header"
                disabled={!isHeaderCollapsed}
                onClick={expandHeader}
              >
                Expand ▲
              </button>
            </div>
          )}
        </div>
        <div id="route-content" ref={routeContentRef}>
          {routes}
        </div>
      </div>
    </div>
  );
}

export default App;
