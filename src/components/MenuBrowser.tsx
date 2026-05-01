import './Menu.css';
import { Link } from "react-router-dom";
import { useHeader } from "../hooks/useHeader.ts";
import { useMenu } from "../hooks/useMenu.tsx";
import ReactGA4 from "react-ga4";

function MenuBrowser({menuName}: { menuName: string }) {
  const {setHeaderContent} = useHeader();
  const {menu} = useMenu(menuName, setHeaderContent);

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
                <Link
                  to={`/${menuName}/${index}`}
                  onClick={() => ReactGA4.event('category_selected', {
                    menu_name: menuName,
                    category_index: index,
                    category_name: categoryName,
                  })}
                >{categoryName}</Link>
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
