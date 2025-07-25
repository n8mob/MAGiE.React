import './Level.css';
import { Link, useNavigate, useParams } from "react-router-dom";
import { BitButton } from "./BitButton";
import { IndexedBit } from "../IndexedBit.ts";
import { Correctness } from "../judgment/BitJudgment.ts";
import { useEffect } from "react";
import { useMenu } from "../hooks/useMenu.tsx";
import { useCategory } from "../hooks/useCategory.tsx";
import { useHeader } from "../hooks/useHeader.ts";
import { useLevel } from "../hooks/useLevel.tsx";

function LevelBrowser({menuName}: { menuName: string }) {
  const {categoryIndex, levelNumber} = useParams();
  const {menu} = useMenu(menuName);
  const {category} = useCategory(menu, categoryIndex);
  const {setHeaderContent} = useHeader();
  const {level} = useLevel(category, levelNumber);
  const navigate = useNavigate();

  useEffect(() => {
    if (!category) {
      console.warn(`Cannot find category[${categoryIndex}] on the menu "${menuName}".`);
      return;
    }

    if (!level) {
      console.error(`Cannot find level ${levelNumber} in category ${categoryIndex}`);
      return;
    }

    setHeaderContent(<div className={'menu-title'}><h3><Link to={`/${menuName}/${categoryIndex}`}>{category.name}</Link></h3>
      {level.levelName.map((nameLine, i) => <h3 key={i}>{nameLine}</h3>)}
    </div>);

  }, [category, categoryIndex, level, levelNumber, menuName, setHeaderContent]);

  if (!level) {
    return <div>Loading level...</div>;
  }

  return (
    <div className={'level-puzzle-bits'} style={{display: "flex", flexDirection: "row", margin: "16px 0"}}>
      {level.puzzles.map((puzzle, i) => (
        <BitButton
          key={puzzle.slug ?? `puzzle-${i}`}
          bit={IndexedBit.falseAtIndex(i)}
          correctness={Correctness.unguessed}    // Update with real progress
          onClick={() =>
            navigate(`/${menuName}/${categoryIndex}/levels/${level.levelNumber}/puzzles/${i}`)
          }
        />
      ))}
    </div>
  );
}

export { LevelBrowser };
