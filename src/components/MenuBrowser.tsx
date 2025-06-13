import './Menu.css';
import { useEffect, useState } from "react";
import { Menu } from "../Menu.ts";
import { getMenu } from "../PuzzleApi.ts";
import { Link } from "react-router-dom";
import { useHeader } from "../hooks/useHeader.ts";

function MenuBrowser({menuName}: { menuName: string }) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const { setHeaderContent } = useHeader();

  useEffect(() => {
    setHeaderContent('-=Proti and Hepi=-');
  }, [setHeaderContent]);

  useEffect(() => {
    getMenu(menuName).then(setMenu);
  }, [menuName]);


  if (!menu) {
    return <div>Loading {menuName}...</div>;
  } else {
    return (
      <div id={'menu'}>
        <div className={'menu-list'}>
          <ul>
            {Object.keys(menu.categories).map((categoryName, index) => (
              <li key={index}>
                <Link to={`/mall/${index}`}>{categoryName}</Link>
              </li>
            ))
            }
          </ul>
        </div>
      </div>
    );
  }
}

export { MenuBrowser };
