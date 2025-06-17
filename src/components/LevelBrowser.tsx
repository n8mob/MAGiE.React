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
  const { level } = useLevel(category, levelNumber);
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

    setHeaderContent(<Link to={`/mall/${categoryIndex}`}>{category.name}</Link>);

  }, [category, categoryIndex, level, levelNumber, menuName, setHeaderContent]);

  if (!level) {
    return <div>Loading level...</div>;
  }

  return (
    <div>
      <h3>{Array.isArray(level.levelName) ? level.levelName.join(" ") : level.levelName}</h3>
      <div style={{display: "flex", flexDirection: "row", margin: "16px 0"}}>
        {level.puzzles.map((puzzle, i) => (
          <BitButton
            key={puzzle.slug ?? `puzzle-${i}`}
            bit={IndexedBit.falseAtIndex(i)}
            correctness={Correctness.unguessed}    // Update with real progress
            onClick={() =>
              navigate(`/mall/${categoryIndex}/levels/${level.levelNumber}/puzzles/${i}`)
            }
          />
        ))}
      </div>
      {/* You can add "Back" or progress info here */}
    </div>
  );
}

export { LevelBrowser };
