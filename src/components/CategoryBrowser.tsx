import './Menu.css';
import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useHeader } from "../hooks/useHeader.ts";
import { useMenu } from "../hooks/useMenu.tsx";
import { useCategory } from "../hooks/useCategory.tsx";

function CategoryBrowser({menuName}: { menuName: string }) {
  const {setHeaderContent} = useHeader();
  const {categoryIndex: categoryIndexParam} = useParams();
  const categoryIndex = parseInt(categoryIndexParam ?? '0', 10);
  const {menu, loading, error} = useMenu(menuName);
  const { category } = useCategory(menu, categoryIndexParam);

  useEffect(() => {
    if (!menu) {
      console.warn('Waiting for the menu.');
      setHeaderContent(<p>Loading category...</p>);
      return;
    }

    if (error) {
      console.error("Error loading menu:", error);
      setHeaderContent(<div className={'menu-title'}>
        <p className={'error-message'}>Error loading menu: {error.message}</p>
      </div> );
      return;
    }

    if (loading) {
      setHeaderContent(<div className={'menu-title'}>
        <p>Loading category...</p>
      </div>);
      return;
    }

    const categoryKeys = Object.keys(menu.categories);
    if (categoryIndex < 0 || categoryIndex >= categoryKeys.length) {
      setHeaderContent(<p>Invalid category index</p>);
      return;
    }

    const categoryName = categoryKeys[categoryIndex];
    setHeaderContent(<div className={'menu-title'}>
      <Link to={`/${menuName}/`}><h3>THE ABANDONED MALL</h3></Link>
      <p>{categoryName}</p>
    </div>);
  }, [menuName, menu, categoryIndex, setHeaderContent, error, loading]);

  if (!menu) {
    return <div>Loading {menuName}...</div>;
  }

  console.log(`categoryIndex: ${categoryIndex} => ${category?.name}`);
  console.log("category", category);

  return (
    <div id={'category'}>
      <div className={'menu-list'}>
        <ol>
          {category?.levels.map((level, i) => {
            const hasNumbers = /^[\d\W]/.test(level.levelName[0]); // starts with digit or symbol
            return <li key={level.levelNumber} className={hasNumbers ? 'numbered-item' : undefined}>
              <Link to={`/${menuName}/${categoryIndex}/levels/${level.levelNumber}/puzzles/0`}>{!hasNumbers ? `${i+1}. ` : ''}{level.levelName.join("\n")}</Link>
            </li>
          })
          }
        </ol>
      </div>
    </div>
  );
}

export { CategoryBrowser };