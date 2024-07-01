import './App.css'
import {useEffect, useState} from "react";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import {getMenu} from "./puzzleApi.ts";
import {Menu} from "./Menu.ts";
import MenuDisplay from "./components/MenuDisplay.tsx";
import LevelMenu from "./components/LevelMenu.tsx";
import LevelPlay from "./components/LevelPlay.tsx";
import LevelStart from "./components/LevelStart.tsx";

function App() {
  var [menu, setMenu] = useState<Menu | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const menuData = await getMenu('BigGame_fromJSON');
        setMenu(menuData);
      } catch (error) {
        console.error('Failed to fetch menu data:', error)
        return <h2>Error</h2>
      }
    };

    fetchMenu();
  }, [])

  return (
    <>
      <h1>MAGiE</h1>
      <Router>
        <Routes>
          <Route path="/" element={
            <>
              {menu && <MenuDisplay
                prompt={<p>Select a category:</p>}
                options={Object.keys(menu.categories)}
                basePath="/category"/>
              }
            </>
          }/>
          <Route path="/category/:categoryName" element={
            <LevelMenu menu={menu}/>
          } />
          <Route path="category/:categoryName/levels/:levelNumber" element={
            <LevelStart menu={menu} />
          } />
          <Route path="category/:categoryName/levels/:levelNumber/puzzle/:puzzleId" element={
            <LevelPlay menu={menu} />
          } />
        </Routes>
      </Router>
    </>
  )
}

export default App
