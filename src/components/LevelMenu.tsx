// In LevelMenu.tsx
import {Link, useParams} from 'react-router-dom';
import React, {Fragment, useEffect} from 'react';
import {Category, Level, Menu} from '../Menu.ts';

interface LevelMenuProps {
  menu: Menu | null;
  setShowBackButton: (show: boolean) => void;
  setBackPath: (path: string) => void;
}

const LevelMenu: React.FC<LevelMenuProps> = ({ menu, setShowBackButton, setBackPath }) => {
  const categoryName = decodeURIComponent(useParams().categoryName || "");
  const category: Category = menu?.categories[categoryName] || {levels: []};
  const levelBaseUri = `/categories/${encodeURIComponent(categoryName)}/levels`;

  useEffect(() => {
    setShowBackButton(true);
    setBackPath('/');
  }, [setBackPath, setShowBackButton]);

  return <Fragment>
    <div className="display">
      <h2>{categoryName}</h2>
      <ol>
        {category.levels.map((level: Level) => {
          const levelName = level.levelName.join("\n");
          return <li key={categoryName + "_level_" + level.sort_order}>
            <Link to={`${levelBaseUri}/${level.levelNumber}/puzzle/0`}>
              {levelName}
            </Link>
          </li>
        })}
      </ol>
    </div>
  </Fragment>
}

export default LevelMenu;
