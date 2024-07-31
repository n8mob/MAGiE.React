import './App.css'
import {useEffect, useState} from "react";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import {getMenu} from "./PuzzleApi.ts";
import {Category, FixedEncodingData, Level, Menu, Puzzle, VariableEncodingData} from "./Menu.ts";
import MenuDisplay from "./components/MenuDisplay.tsx";
import LevelMenu from "./components/LevelMenu.tsx";
import LevelPlay from "./components/LevelPlay.tsx";
import FixedWidthEncoder from "./encoding/FixedWidthEncoder.ts";
import VariableWidthEncoder from "./encoding/VariableWidthEncoder.ts";
import BackButton from "./components/BackButton.tsx";

function App() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [showBackButton, setShowBackButton] = useState(false);
  const [backPath, setBackPath] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const menuData = await getMenu('ReactTests');
        menuData.encodingProviders = {};
        Object.entries(menuData.encodings).map(([encodingName, encodingData]) => {
          if (encodingData.type == "fixed") {
            const fixedEncoding = encodingData as FixedEncodingData;
            menuData.encodingProviders[encodingName] = new FixedWidthEncoder(
              fixedEncoding.encoding.width,
              fixedEncoding.encoding.encodingMap
            );
          } else if (encodingData.type == "variable") {
            const variableEncoding = encodingData as VariableEncodingData;
            menuData.encodingProviders[encodingName] = new VariableWidthEncoder(variableEncoding.encoding);
          }
        });

        Object.values(menuData.categories).map((category: Category) => {
          category.levels.map((level: Level) => {
            level.puzzles.map((puzzle: Puzzle) => {
              puzzle.encoding = menuData.encodingProviders[puzzle.encoding_name];
            });
          });
        });
        setMenu(menuData);
      } catch (error) {
        console.error('Failed to fetch menu data:', error)
        return <h2>Error</h2>
      }
    };

    fetchMenu().catch(error => console.error('Error fetching menu data.', error));
  }, [])

  return (
    <>
      <Router>
        {showBackButton && backPath && <BackButton backPath={backPath} />}
        <h1>MAGiE</h1>
        <Routes>
          <Route path="/" element={
            <>
              {menu && <MenuDisplay
                prompt={<p>Select a category:</p>}
                options={Object.keys(menu.categories)}
                basePath="/categories"
                setShowBackButton={setShowBackButton}
                setBackPath={setBackPath}
              />}
            </>
          }/>
          <Route path="/categories/:categoryName" element={
            <LevelMenu menu={menu} setShowBackButton={setShowBackButton} setBackPath={setBackPath} />
          }/>
          <Route path="/categories/:categoryName/levels/:levelNumber/puzzle?/:puzzleId" element={
            <LevelPlay menu={menu} setShowBackButton={setShowBackButton} setBackPath={setBackPath} />
          }/>
        </Routes>
      </Router>
    </>
  )
}

export default App
