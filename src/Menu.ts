export interface Puzzle {
  init: string;
  clue: string[];
  winText: string[];
}

export interface Level {
  levelName: string[];
  puzzles: Puzzle[];
}

export interface Category {
  levels: Level[];
}

export interface Menu {
  categories: Record<string, Category>;
}
