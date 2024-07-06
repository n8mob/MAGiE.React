import {BinaryEncoder} from "./BinaryEncoder.ts";

export interface EncodingData {
  type: "variable" | "fixed";
  encoding: unknown;
}

export interface FixedEncodingData extends EncodingData {
  type: "fixed";
  encoding: {
    width: number;
    encodingMap: Record<string, number>
  };
}

export type EncodingSymbol = string;
export interface VariableEncodingData extends EncodingData {
  type: "variable";
  encoding: Record<EncodingSymbol, Record<string, string>>;
}

export interface Puzzle {
  init: string;
  clue: string[];
  winText: string;
  winMessage: string[];
  type: "Encode" | "Decode";
  encoding_name: string;
  encoding: BinaryEncoder;
}

export interface Level {
  levelName: string[];
  levelNumber: string;
  sort_order: number | null;
  puzzles: Puzzle[];
}

export interface Category {
  levels: Level[];
}

export interface Menu {
  categories: Record<string, Category>;
  encodings: Record<string, EncodingData>;
  encodingProviders: Record<string, BinaryEncoder>;
}
