import {Puzzle} from "../Menu.ts";
import React, {useEffect, useState} from "react";
import FullJudgment from "../FullJudgment.ts";
import DisplayMatrix from "./DisplayMatrix.tsx";
import {SequenceJudgment} from "../SequenceJudgment.ts";

interface DecodePuzzleProps {
  puzzle?: Puzzle;
  displayWidth: number;
  onWin: () => void;
}

const DecodePuzzle: React.FC<DecodePuzzleProps> = ({puzzle, displayWidth, onWin}) => {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | undefined>(puzzle);
  const [guessText, setGuessText] = useState("");
  const [guessBits, setGuessBits] = useState("");
  const [winBits, setWinBits] = useState<string>("");
  const [judgment, setJudgment] = useState(new FullJudgment<SequenceJudgment>(false, "", []));

  // Update currentPuzzle when the puzzle prop changes
  useEffect(() => {
    setCurrentPuzzle(puzzle);
    setGuessText("");
    setGuessBits("");
    setWinBits("");
    setJudgment(new FullJudgment<SequenceJudgment>(false, "", []));
  }, [puzzle]);

  // initialize guessBits and winBits when the currentPuzzle changes
  useEffect(() => {
    if (currentPuzzle) {
      setGuessText(currentPuzzle.init);
      const newWinText = currentPuzzle.encoding.encodeText(currentPuzzle.winText);
      setWinBits(newWinText);
      setJudgment(new FullJudgment(false, "", []));
    }
  }, [currentPuzzle]);

  useEffect(() => {
    if (currentPuzzle && guessText) {
      const newGuessBits = currentPuzzle.encoding.encodeText(guessText);
      setGuessBits(newGuessBits);
    }
  }, [currentPuzzle, guessText]);

  // Update judgment when guessBits or winBits changes
  useEffect(() => {
    if (currentPuzzle && guessBits && winBits) {
      const judgment = currentPuzzle?.encoding.judgeBits(
        guessBits,
        winBits,
        displayWidth
      );

      setJudgment(judgment);
    }
  }, [currentPuzzle, guessBits, winBits, displayWidth]);

  return <>
    <DisplayMatrix
      key={`${currentPuzzle?.init}-${guessBits}`}
      guessBits={guessBits}
      judgment={judgment.sequenceJudgments}
      decodedGuess={puzzle?.encoding.decodeText(guessBits) || ""}
      handleBitClick={() => {}}  // bits will be read-only for the decode puzzle
      />
    <div className="encodingInputs">
      <p>
        <input type="text" value={guessText} onChange={handleGuessUpdate}/>
      </p><p>
        <input type="button" value="Submit" onClick={handleSubmitClick}/>
      </p>
    </div>
  </>;

  function handleGuessUpdate(event: React.ChangeEvent<HTMLInputElement>) {
    const newGuessText = event.target.value.toUpperCase();
    setGuessText(newGuessText);
    const newGuessBits = currentPuzzle?.encoding.encodeText(newGuessText) || "";
    setGuessBits(newGuessBits);
  }

  function handleSubmitClick() {
    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return;
    } else {
      const newJudgment = currentPuzzle.encoding.judgeBits(guessBits, winBits, displayWidth);
      if (newJudgment.isCorrect) {
        onWin?.();
      } else {
        setJudgment(newJudgment);
      }
    }
  }
}

export default DecodePuzzle;
