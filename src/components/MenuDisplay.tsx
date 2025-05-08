import {FC, Fragment, ReactNode, useEffect} from "react";
import {Link} from "react-router-dom";

interface MenuProps {
  prompt: ReactNode;
  options: string[];
  basePath: string;
  setShowBackButton: (show: boolean) => void;
  setBackPath: (path: string) => void;
}

const MenuDisplay: FC<MenuProps> = (
  {
    prompt,
    options,
    basePath,
    setShowBackButton: setShowBackButton
  }) => {
  useEffect(() => {
    setShowBackButton(false);
  }, [setShowBackButton]);

  return (
    <Fragment>
    <div className="display">
      <h3>{prompt}</h3>
      <ol>
        {options.map(menuLine => (<li key={menuLine}>
          <Link to={`${basePath}/${encodeURIComponent(menuLine)}`}>{menuLine}</Link>
        </li>))}
      </ol>
    </div>
    </Fragment>
  )
}

export default MenuDisplay;
