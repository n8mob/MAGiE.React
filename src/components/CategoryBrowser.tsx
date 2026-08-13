import './Menu.css';
import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useHeader } from "../hooks/useHeader.ts";
import { useMenu } from "../hooks/useMenu.tsx";
import { useCategory } from "../hooks/useCategory.tsx";
import ReactGA4 from "react-ga4";
import { usePageTitle } from "../hooks/usePageTitle.ts";
import { categoryTitle } from "../pageTitles.ts";

function CategoryBrowser({ menuName }: { menuName: string }) {
  const { setHeaderContent } = useHeader();
  const { categoryIndex: categoryIndexParam } = useParams();
  const categoryIndex = parseInt(categoryIndexParam ?? '0', 10);
  const { menu, loading, error } = useMenu(menuName, setHeaderContent);
  const { category } = useCategory(menu, categoryIndex);
  // null until the menu resolves and the category name is known.
  usePageTitle(category?.name ? categoryTitle(menuName, category.name) : null);


  useEffect(() => {
    if (!menu) {
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
        <p>Loading menu...</p>
      </div>);
      return;
    }

    if (!menu.categories) {
      setHeaderContent(<div className={'menu-title'}>
        <p>No categories found</p>
        <p>In {menuName} menu.</p>
      </div>);
      return;
    }

    if (categoryIndex < 0 || categoryIndex >= Object.keys(menu.categories).length) {
      setHeaderContent(<p>Invalid category index</p>);
      return;
    }

    setHeaderContent(
      <div className={'menu-title'}>
        <h3 className="menu-title-row">
          <Link
            className="symbol-button puzzle-symbol-button"
            to={`/${menuName}/`}
            aria-label={`Back to ${menuName} menu`}
          >⏏</Link>
          <span>{category?.name}</span>
          <span className="menu-title-balance" aria-hidden="true" />
        </h3>
      </div>
    );
  }, [menuName, menu, categoryIndex, setHeaderContent, error, loading, categoryIndexParam, category?.name, category]);

  return (
    <div id={'category'}>
      <div className={'menu-list'}>
        <ol>
          {category?.levels.map((level) => {
            return <li key={level.levelNumber}>
              <Link
                to={`/${menuName}/${categoryIndex}/levels/${level.levelNumber}/puzzles/0`}
                onClick={() => ReactGA4.event('level_selected', {
                  menu_name: menuName,
                  category_index: categoryIndex,
                  level_number: level.levelNumber,
                  level_name: level.levelName.join(' '),
                })}
              >{level.levelName.join("\n")}</Link>
            </li>
          })
          }
        </ol>
      </div>
    </div>
  );
}

export { CategoryBrowser };
