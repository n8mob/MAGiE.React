import './Menu.css';
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu } from "../Menu.ts";
import { getMenu } from "../PuzzleApi.ts";
import { useHeader } from "../hooks/useHeader.ts";

function CategoryBrowser({menuName}: { menuName: string }) {
  const {setHeaderContent} = useHeader();
  const {categoryIndex: categoryIndexParam} = useParams();
  const categoryIndex = parseInt(categoryIndexParam ?? '0', 10);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');

  useEffect(() => {
    getMenu(menuName)
      .then(fetchedMenu => {
        setMenu(fetchedMenu);
      })
      .catch(error => {
        console.error("Error fetching menu:", error);
        setHeaderContent(<p>Error loading menu</p>);
      });
  }, [menuName, setHeaderContent]);

  useEffect(() => {
    if (!menu) {
      setHeaderContent(<p>Loading category...</p>);
      return;
    }
    const categoryKeys = Object.keys(menu.categories);
    if (categoryIndex < 0 || categoryIndex >= categoryKeys.length) {
      setHeaderContent(<p>Invalid category index</p>);
      return;
    }
    setCategoryName(categoryKeys[categoryIndex]);
    const categoryName = categoryKeys[categoryIndex];
    setHeaderContent(<div className={'menu-title'}>
      <Link to={'/mall/'}><h3>THE ABANDONED MALL</h3></Link>
      <p>{categoryName}</p>
    </div>);
  }, [menu, categoryIndex, setHeaderContent]);

  if (!menu) {
    return <div>Loading {menuName}...</div>;
  }

  const category = menu.categories[categoryName];

  console.log(`categoryIndex: ${categoryIndex} => ${categoryName}`);
  console.log("category", category);

  return (
    <div id={'category'}>
      <div className={'menu-list'}>
        <ol>
          {category?.levels.map((level, i) => {
            const hasNumbers = /^[\d\W]/.test(level.levelName[0]); // starts with digit or symbol
            return <li key={level.levelNumber} className={hasNumbers ? 'numbered-item' : undefined}>
              <Link to={`/mall/${categoryIndex}/levels/${level.levelNumber}/puzzles/0`}>{!hasNumbers ? `${i+1}. ` : ''}{level.levelName.join("\n")}</Link>
            </li>
          })
          }
        </ol>
      </div>
    </div>
  );
}

export { CategoryBrowser };