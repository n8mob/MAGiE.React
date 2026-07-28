import { useContext, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { PageTitleContext } from "../components/PageTitleContext.tsx";

/**
 * Declare this route's page title.
 *
 * Pass `null` while the data behind the title is still loading; the page_view is
 * held until a real string arrives, so a cold load reports the same title as a
 * click-through rather than whatever the previous page was called.
 *
 * A route that doesn't call this gets the default title and an immediate
 * page_view — no route is ever silently dropped.
 */
export function usePageTitle(title: string | null) {
  const context = useContext(PageTitleContext);
  const location = useLocation();
  const path = location.pathname + location.search;
  const claimTitle = context?.claimTitle;

  useLayoutEffect(() => {
    // A layout effect, deliberately. React flushes every layout effect in the
    // tree before any passive one, so this always lands before usePageTracking's
    // page_view effect — including the first pass, where `title` is still null.
    // A passive effect here would race it and lose, because children run first.
    claimTitle?.(path, title);
  }, [claimTitle, path, title]);
}
