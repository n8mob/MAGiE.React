import './Menu.css';
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useHeader } from "../hooks/useHeader.ts";
import { useMenu } from "../hooks/useMenu.tsx";
import { MENU_NAME_MAP } from '../MenuNames.tsx';

function MenuBrowser({menuName}: { menuName: string }) {
  const {menu} = useMenu(menuName);
  const {setHeaderContent} = useHeader();

  useEffect(() => {
    setHeaderContent(MENU_NAME_MAP[menuName]?.titleNode ?? menuName);
  }, [setHeaderContent, menuName]);

  if (!menu) {
    return <div>Loading {menuName}...</div>;
  } else {
    return (
      <div id={'menu'}>
        <div className={'menu-list'}>
          <ol>
            {Object.keys(menu.categories).map((categoryName, index) => {
              const hasNumbers = /^[\d\W]/.test(categoryName); // starts with digit or symbol
              return <li key={index} className={hasNumbers ? 'numbered-item' : undefined}>
                <Link to={`/${menuName}/${index}`}>{categoryName}</Link>
              </li>
            })
            }
          </ol>
        </div>
      </div>
    );
  }
}

export { MenuBrowser };
