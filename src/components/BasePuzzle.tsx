import { useEffect, useState } from "react";
import { Puzzle } from "../Menu.ts";
import BinaryJudge from "../BinaryJudge.ts";
import FullJudgment from "../FullJudgment.ts";
import { SequenceJudgment } from "../SequenceJudgment.ts";
import DisplayMatrix from "./DisplayMatrix.tsx";

interface PuzzleProps {
  puzzle: Puzzle;
  displayWidth: number;
  onWin: () => void;
}

const BasePuzzle: React.FC<PuzzleProps> = ({ puzzle, displayWidth, onWin }) => {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | undefined>(puzzle);
  const [judge, setJudge] = useState<BinaryJudge | null>(null);
  const [guessBits, setGuessBits] = useState("");
  const [winBits, setWinBits] = useState<string>("");
  const [judgment, setJudgment] = useState(new FullJudgment<SequenceJudgment>(false, "", []));
  const [guessText, setGuessText] = useState<string>("");

  // Flag to prevent infinite loop
  const [updating, setUpdating] = useState(false);

  // Update currentPuzzle when the puzzle gets updated
  useEffect(() => {
    setCurrentPuzzle(puzzle);
    setGuessBits("");
    setWinBits("");
    setJudgment(new FullJudgment<SequenceJudgment>(false, "", []));
  }, [puzzle]);

  // Update winBits when puzzle changes
  useEffect(() => {
    if (currentPuzzle) {
      const newWinText = currentPuzzle.encoding.encodeText(currentPuzzle.winText);
      setWinBits(newWinText);
    }
  }, [currentPuzzle]);

  // Update guessBits when guessText changes
  useEffect(() => {
    if (!updating && currentPuzzle) {
      setUpdating(true);
      const newGuessBits = currentPuzzle.encoding.encodeText(guessText);
      setGuessBits(newGuessBits);
      setUpdating(false);
    }
  }, [guessText, currentPuzzle]);

  // Update guessText when guessBits changes
  useEffect(() => {
    if (!updating && currentPuzzle) {
      setUpdating(true);
      const newGuessText = currentPuzzle.encoding.decodeText(guessBits);
      setGuessText(newGuessText);
      setUpdating(false);
    }
  }, [guessBits, currentPuzzle]);

  // Update judgment
  useEffect(() => {
    if (currentPuzzle && judge && winBits && guessBits) {
      const judgment = judge?.judgeBits(guessBits, winBits, displayWidth);
      if (judgment) {
        setJudgment(judgment);
      }
    }
  }, [currentPuzzle, guessBits, winBits, judge]);

  return (
    <>
      <DisplayMatrix
        key={`${currentPuzzle}-${guessBits}-${judgment}`}
        guessBits={guessBits}
        judgments={judgment.sequenceJudgments}
        decodedGuess={guessText}
        handleBitClick={() => {}} // read-only bits, EncodePuzzle can add an update function.
      />
    </>
  );
};

export default BasePuzzle;
export type { PuzzleProps };
