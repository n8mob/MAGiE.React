import React, {Fragment} from "react";
import {useParams} from "react-router-dom";
import {Menu, Category, Level} from "../Menu.ts";
import {Link} from "react-router-dom";

interface LevelMenuProps {
  menu: Menu | null;
}

const LevelMenu: React.FC<LevelMenuProps> = (
  {
    menu,
  }) => {
  const { categoryName} = useParams();

  if (categoryName === undefined) {
    return <><h2>No category given</h2></>;
  }

  if (!menu || !(categoryName in menu.categories)) {
    return <><h2>Cannot find category "{categoryName}"</h2></>;
  }

  const category: Category = menu.categories[categoryName];

  return <Fragment>
    <div className="display">
      <h2>{categoryName}</h2>
      <ol>
        {category.levels.map((level: Level) => {
          const levelName = level.levelName.join("\n");
          return <Link to={`/category/${categoryName}/levels/${level.levelNumber}`}>
            <li>{levelName}</li>
          </Link>
        })}
      </ol>
    </div>
  </Fragment>
}

export default LevelMenu;