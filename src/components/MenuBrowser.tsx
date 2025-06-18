import './Menu.css';
import { useEffect, useState } from "react";
import { Menu } from "../Menu.ts";
import { getMenu } from "../PuzzleApi.ts";
import { Link } from "react-router-dom";
import { useHeader } from "../hooks/useHeader.ts";

function MenuBrowser({menuName}: { menuName: string }) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const {setHeaderContent} = useHeader();

  useEffect(() => {
    setHeaderContent(<div className={'menu-title'}>
      <p>-= Proti and Hepi =-</p>
      <p>in</p>
      <h3>The Abandoned Mall</h3>
    </div>);
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
          <ol>
            {Object.keys(menu.categories).map((categoryName, index) => {
              const hasNumbers = /^[\d\W]/.test(categoryName); // starts with digit or symbol
              return <li key={index} className={hasNumbers ? 'numbered-item' : undefined}>
                <Link to={`/mall/${index}`}>{categoryName}</Link>
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
