import './PageNotFound.css';
import { useHeader } from '../hooks/useHeader.ts';
import { Link } from "react-router-dom";
import { shortDate } from "./DateFormatter.tsx";
import { useEffect } from "react";

function PageNotFound() {
  const {setHeaderContent} = useHeader();

  useEffect(() => {
    const notFoundDiv = <>
      <div className="page-not-found">
        <h1>404</h1>
        <h2>Page Not Found</h2>
      </div>
    </>;
    setHeaderContent(notFoundDiv);
  }, [setHeaderContent]);

  const date = new Date();
  const displayDate = shortDate(date);
  return (<>
      <div id={'game-content'}>
        <div id={'main-display'}>
          <p>No Data.</p>
          <p>Please swipe card</p>
          <p>or</p>
          <p>Skip to <Link to={`/`}>{displayDate}&nbsp;&gt;&gt;|</Link></p>
        </div>
      </div>
    </>
  )
}

export { PageNotFound };
