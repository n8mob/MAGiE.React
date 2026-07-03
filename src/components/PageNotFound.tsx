import './PageNotFound.css';
import { useHeader } from '../hooks/useHeader.ts';
import { Link } from "react-router-dom";
import { useEffect } from "react";

function PageNotFound() {
  const { setHeaderContent } = useHeader();

  useEffect(() => {
    const notFoundDiv = <>
      <div className="page-not-found">
        <h1>404</h1>
        <h2>Page Not Found</h2>
      </div>
    </>;
    setHeaderContent(notFoundDiv);
    // Clear the 404 heading when navigating away; not every destination
    // sets its own header content (e.g. the story pages). See #175.
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  return (<>
      <div id={'game-content'}>
        <div id={'main-display'}>
          <p>No Data.</p>
          <p>Please swipe card</p>
          <p>or</p>
          <p>Skip to <Link to={'/story'}>Story&nbsp;▶▶|</Link></p>
        </div>
      </div>
    </>
  )
}

export { PageNotFound };
