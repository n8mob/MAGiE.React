import { FixedWidthEncoder } from "./encoding/FixedWidthEncoder.ts";
import { VariableWidthEncoder } from "./encoding/VariableWidthEncoder.ts";
import { FixedWidthEncodingData, Puzzle, PuzzleForDate, VariableWidthEncodingData } from "./Menu.ts";

const fetchPuzzle = async (fetchFunction: () => Promise<PuzzleForDate>): Promise<Puzzle> => {
  const puzzleData = await fetchFunction();
  const puzzle: Puzzle = puzzleData.puzzle;
  let encodingData: FixedWidthEncodingData | VariableWidthEncodingData;
  if (puzzleData.encoding.type === "fixed") {
    encodingData = puzzleData.encoding as FixedWidthEncodingData;
    puzzle.encoding = new FixedWidthEncoder(encodingData.encoding.width, encodingData.encoding.encodingMap);
  } else {
    encodingData = puzzleData.encoding as VariableWidthEncodingData;
    puzzle.encoding = new VariableWidthEncoder(encodingData.encoding);
  }
  return puzzle;
};

export { fetchPuzzle };
