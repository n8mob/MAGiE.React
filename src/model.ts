import { BinaryEncoder } from "./encoding/BinaryEncoder.ts";
import { FixedWidthEncoder } from "./encoding/FixedWidthEncoder.ts";
import { VariableWidthEncoder } from "./encoding/VariableWidthEncoder.ts";

export type EncodingType = "Fixed" | "Variable" | "Other";

export interface EncodingData {
  type: "variable" | "fixed";
  encoding: unknown;
}

export interface FixedWidthEncodingData extends EncodingData{
  type: "fixed";
  encoding: {
    width: number;
    encodingMap: Record<string, number>;
  };
}

export interface VariableWidthEncodingData extends EncodingData{
  type: "variable";
  encoding: Record<string, Record<string, string>>;
}

export type ChocolateClock = "none" | "advance" | "scroll";
export type ChocolateScoring = "time" | "strikes";

export interface Puzzle {
  slug: string;
  init: string;
  clue: string[];
  winText: string;
  winMessage: string[];
  type: "Encode" | "Decode" | "Chocolate";
  encoding_name: string;
  encoding: BinaryEncoder;
  // Chocolate-mode fields; absent on Encode/Decode puzzles, defaulted in ChocolateMode.
  clock?: ChocolateClock;
  scoring?: ChocolateScoring[];
  scrollSpeed?: number;
  scrollAccel?: number;
  maxStrikes?: number;
}

/**
 * A puzzle that arrives already solved: a demo screen rather than something to
 * win. Every mode's win-text caption ("SEE HOW THE BIT WENT FROM PURPLE TO
 * GREEN?", "IT IS .ON.") depends on this, since a modal covering the bits it
 * points at would teach nothing.
 */
export const isAutoWinPuzzle = (puzzle: Puzzle): boolean => puzzle.init === puzzle.winText;

export interface Level {
  levelName: string[];
  levelNumber: number;
  sort_order: number | null;
  puzzles: Puzzle[];
}

export interface Category {
  name: string;
  levels: Level[];
}

export interface MenuData {
  name: string;
  updated_at?: string;
  categories: Record<string, Category>;
  encodings: Record<string, EncodingData>;
}

export class Menu {
  name: string;
  updated_at?: string;

  categories: Record<string, Category>;
  encodings: Record<string, EncodingData>;
  encodingProviders: Record<string, BinaryEncoder>;
  /**
   * Puzzle slug -> 1-based ordinal across the whole menu, in the order a player
   * walking straight through would meet them: categories in key order, levels in
   * array order, puzzles in array order.
   *
   * `sort_order` is deliberately not consulted — if it's ever missing that's a
   * data bug, and array order is what the player actually experiences. See
   * docs/magie-analytics-spec.md.
   */
  menuPositions: Record<string, number>;

  constructor(data: MenuData) {
    this.name = data.name || "Unknown Menu";
    this.updated_at = data.updated_at;
    this.categories = {};
    Object.entries(data.categories).forEach(([key, category]) => {
      this.categories[key] = { ...category, name: key };
    });

    this.menuPositions = {};
    let position = 0;
    Object.values(this.categories).forEach(category => {
      (category.levels ?? []).forEach(level => {
        (level.puzzles ?? []).forEach(puzzle => {
          position += 1;
          // First occurrence wins, so a slug repeated by mistake keeps a stable
          // position instead of drifting to wherever it last appeared.
          if (puzzle.slug && !(puzzle.slug in this.menuPositions)) {
            this.menuPositions[puzzle.slug] = position;
          }
        });
      });
    });
    this.encodings = data.encodings;
    this.encodingProviders = {};
    Object.entries(data.encodings).forEach(([encodingName, encodingData]) => {
      if (encodingData.type === "fixed") {
        const fixedEncodingData = encodingData as FixedWidthEncodingData;
        this.encodingProviders[encodingName] = new FixedWidthEncoder(
          fixedEncodingData.encoding.width,
          fixedEncodingData.encoding.encodingMap
        );
      } else if (encodingData.type === "variable") {
        const variableEncodingData = encodingData as VariableWidthEncodingData;
        this.encodingProviders[encodingName] = new VariableWidthEncoder(variableEncodingData.encoding);
      }
    });
  }
}

export interface PuzzleForDate {
  date: string;
  puzzle: Puzzle;
  encoding: EncodingData;
  updated_at?: string;
}
