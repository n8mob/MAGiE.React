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

export interface Puzzle {
  slug: string;
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
  levelNumber: number;
  sort_order: number | null;
  puzzles: Puzzle[];
}

export interface Category {
  name: string;
  levels: Level[];
}

export interface MenuData {
  categories: Record<string, Category>;
  encodings: Record<string, EncodingData>;
}

export class Menu {
  categories: Record<string, Category>;
  encodings: Record<string, EncodingData>;
  encodingProviders: Record<string, BinaryEncoder>;
  constructor(data: MenuData) {
    this.categories = {};
    Object.entries(data.categories).forEach(([key, category]) => {
      this.categories[key] = { ...category, name: key };
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
}
