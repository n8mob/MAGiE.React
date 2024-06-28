import './App.css'
import MAGiEDisplay from "./components/MAGiEDisplay.tsx";
import {useEffect, useState} from "react";
import {getMenu} from "./puzzleApi.ts";
import {Menu} from "./Menu.ts";

function App() {
  const [menu, setMenu] = useState<Menu | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const menuData = await getMenu('AbandonedMall');
        setMenu(menuData);
      } catch (error) {
        console.error('Failed to fetch menu data:', error)
      }
    };

    fetchMenu();
  }, [])

  const category = menu?.categories['Into Mall Jail'];

  if (!category) {
    return <h1>Loading...</h1>;
  }

  return (
    <>
      <h1>MAGiE</h1>
      {menu && <MAGiEDisplay bits={category.levels[0].puzzles[0].init} encodingWidth={13} clue={category.levels[0].puzzles[0].clue} />}
    </>
  )
}

export default App
