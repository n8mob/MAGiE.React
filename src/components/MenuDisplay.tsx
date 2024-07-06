import React, {Fragment} from "react";
import {Link} from "react-router-dom";

interface MenuProps {
  prompt: JSX.Element;
  options: string[];
  basePath: string;
}

const MenuDisplay: React.FC<MenuProps> = (
  {
    prompt,
    options,
    basePath
  }) => {
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
