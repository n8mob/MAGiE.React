import { createContext, MutableRefObject, ReactNode, useCallback, useMemo, useRef, useState } from "react";

/**
 * Lets a route declare its page title, so usePageTracking can put a real title on
 * the page_view instead of whatever `document.title` happens to say.
 *
 * The reason this needs a context at all is timing. usePageTracking lives in App
 * and fires on location change, but the titles that matter (level name, puzzle
 * number) come from menu data that arrives asynchronously. Letting the tracker
 * read `document.title` would mean correct titles when clicking between puzzles
 * and stale ones on every cold load — inconsistent rather than merely wrong.
 *
 * So a route claims the slot with `title: null` to mean "mine, still loading",
 * and the page_view waits for a real string.
 *
 * The claim lives in a **ref**, not in state, and that is load-bearing. A child's
 * layout effect does run before the parent's passive effect, but the state update
 * it schedules doesn't reach that passive effect — the parent's effect closed over
 * the context value from a render that already happened. A ref is read live, so
 * the tracker sees the claim its own child just made. The version counter beside
 * it exists only to re-run the tracker when a title resolves later.
 */

export interface PageTitleClaim {
  /** The location this claim is for. Stale claims from a previous route are ignored. */
  path: string;
  /** null while the data behind the title is still loading. */
  title: string | null;
}

interface PageTitleContextType {
  claimRef: MutableRefObject<PageTitleClaim>;
  /** Bumped on every genuine claim, purely to retrigger usePageTracking's effect. */
  version: number;
  claimTitle: (path: string, title: string | null) => void;
}

// A real path always starts with "/", so this can never match one.
const NO_CLAIM: PageTitleClaim = { path: "", title: null };

// eslint-disable-next-line react-refresh/only-export-components
export const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined);

export const PageTitleProvider = ({ children }: { children: ReactNode }) => {
  const claimRef = useRef<PageTitleClaim>(NO_CLAIM);
  const [version, setVersion] = useState(0);

  const claimTitle = useCallback((path: string, title: string | null) => {
    const previous = claimRef.current;
    // Idempotent, so a repeated claim can't spin the render loop.
    if (previous.path === path && previous.title === title) {
      return;
    }
    claimRef.current = { path, title };
    setVersion(current => current + 1);
  }, []);

  const value = useMemo(
    () => ({ claimRef, version, claimTitle }),
    [version, claimTitle]
  );

  return <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>;
};
