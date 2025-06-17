import { Category } from "../Menu";

export function useLevel(category: Category | null, levelNumberParam: string | number | undefined) {
  if (!levelNumberParam || !category || !category.levels) {
    return {level: null};
  }

  let levelNumber: number;
  if (typeof levelNumberParam === "number") {
    levelNumber = levelNumberParam;
  } else if (/^\d+$/.test(levelNumberParam)) {
    levelNumber = parseInt(levelNumberParam, 10);
  } else {
    return {level: null};
  }

  const level = category.levels.find(level => level.levelNumber == levelNumber) || null;
  return {level};
}