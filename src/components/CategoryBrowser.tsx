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
        setHeaderContent('Error loading menu');
      });
  }, [menuName, setHeaderContent]);

  useEffect(() => {
    if (!menu) {
      setHeaderContent('Loading category...');
      return;
    }
    const categoryKeys = Object.keys(menu.categories);
    if (categoryIndex < 0 || categoryIndex >= categoryKeys.length) {
      setHeaderContent('Invalid category index');
      return;
    }
    setCategoryName(categoryKeys[categoryIndex]);
    const categoryName = categoryKeys[categoryIndex];
    setHeaderContent(`${categoryName}`);
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
        <ul>
          {category?.levels.map((level) => (
            <li key={level.levelNumber}>
              <Link to={`/mall/${categoryIndex}/levels/${level.levelNumber}/puzzles/0`}>{level.levelName.join("\n")}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export { CategoryBrowser };