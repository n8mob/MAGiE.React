import './Menu.css';
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useHeader } from "../hooks/useHeader.ts";
import { useMenu } from "../hooks/useMenu.tsx";

function MenuBrowser({menuName}: { menuName: string }) {
  const {menu} = useMenu(menuName);
  const {setHeaderContent} = useHeader();

  useEffect(() => {
    setHeaderContent(<div className={'menu-title'}>
      <p>-= Proti and Hepi =-</p>
      <p>in</p>
      <h3>The Abandoned Mall</h3>
    </div>);
  }, [setHeaderContent]);

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
