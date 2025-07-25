import { Category } from "../model.ts";

export function useLevel(category: Category | null, levelNumberParam: string | number | undefined) {
  if (!levelNumberParam) {
    console.debug("No level number provided.");
    return {level: null};
  } else if (!category) {
    console.debug(`Asking for level number ${levelNumberParam}, but no category provided.`);
    return {level: null};
  } else if (!category.levels) {
    console.debug(`Asking for level number ${levelNumberParam}, but category has no levels.`);
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