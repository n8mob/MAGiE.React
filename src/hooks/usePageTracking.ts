import { useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA4 from 'react-ga4';
import { PageTitleContext } from '../components/PageTitleContext.tsx';
import { DEFAULT_PAGE_TITLE } from '../pageTitles.ts';

export function usePageTracking() {
  const location = useLocation();
  const pageTitle = useContext(PageTitleContext);
  const path = location.pathname + location.search;
  const sentPath = useRef<string | null>(null);

  const claimRef = pageTitle?.claimRef;
  const version = pageTitle?.version;

  useEffect(() => {
    /*
     * Read through the ref, not a captured value: the route's layout effect has
     * already run by now and written its claim there. A route that needs async
     * data claims this path with a null title, so a claim that doesn't match the
     * current path means no route is going to make one, and the default can go
     * out immediately — no timeout, no dropped page_view.
     */
    const claim = claimRef?.current;
    const claimed = claim?.path === path;
    const title = claimed ? claim.title : DEFAULT_PAGE_TITLE;

    if (title !== null) {
      document.title = title;
    }

    // Still resolving, or already counted. Re-sending would double-count the page.
    if (title === null || sentPath.current === path) {
      return;
    }

    sentPath.current = path;
    ReactGA4.send({ hitType: 'pageview', page: path, title });
  }, [path, claimRef, version]);
}
