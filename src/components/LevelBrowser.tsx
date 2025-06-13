import { useParams, useNavigate } from "react-router-dom";
import { BitButton } from "./BitButton";
import { Menu } from "../Menu.ts";
import { IndexedBit } from "../IndexedBit.ts";
import { Correctness } from "../judgment/BitJudgment.ts";

function LevelBrowser({ menu }: { menu: Menu }) {
  const { categoryIndex, levelNumber } = useParams();
  const navigate = useNavigate();

  // Derive category and level
  const categoryKeys = Object.keys(menu.categories);
  const category = menu.categories[categoryKeys[parseInt(categoryIndex ?? '0', 10)]];
  const level = category.levels.find(l => l.levelNumber === levelNumber);

  if (!level) return <div>Loading level...</div>;

  return (
    <div>
      <h2>{Array.isArray(level.levelName) ? level.levelName.join(" ") : level.levelName}</h2>
      <div style={{ display: "flex", flexDirection: "row", margin: "16px 0" }}>
        {level.puzzles.map((puzzle, i) => (
          <BitButton
            key={puzzle.slug ?? `puzzle-${i}`}
            bit={IndexedBit.falseAtIndex(i)}
            correctness={Correctness.unguessed}    // Update with real progress
            onChange={() =>
              navigate(`/mall/${categoryIndex}/levels/${level.levelNumber}/puzzle/${i}`)
            }
          />
        ))}
      </div>
      {/* You can add "Back" or progress info here */}
    </div>
  );
}

export { LevelBrowser };
