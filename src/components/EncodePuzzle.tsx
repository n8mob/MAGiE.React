import {Puzzle} from "../Menu.ts";
import React, {useCallback, useEffect, useState} from "react";
import FullJudgment from "../FullJudgment.ts";
import DisplayMatrix from "./DisplayMatrix.tsx";
import {DisplayRow} from "../BinaryEncoder.ts";
import {SequenceJudgment} from "../SequenceJudgment.ts";

interface EncodePuzzleProps {
  puzzle?: Puzzle;
  displayWidth: number;
  onWin: () => void;
}

const EncodePuzzle: React.FC<EncodePuzzleProps> = ({puzzle, displayWidth, onWin}) => {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | undefined>(puzzle);
  const [guessBits, setGuessBits] = useState("");
  const [winBits, setWinBits] = useState<string>("");
  const [judgment, setJudgment] = useState(new FullJudgment<SequenceJudgment>(false, "", []));
  const [displayRows, setDisplayRows] = useState<DisplayRow[]>([]);

  // Update currentPuzzle when the puzzle prop changes
  useEffect(() => {
    setCurrentPuzzle(puzzle);
    setGuessBits("");
    setWinBits("");
    setJudgment(new FullJudgment<SequenceJudgment>(false, "", []));
    setDisplayRows([]);
  }, [puzzle]);

  // initialize guessBits and winBits when the currentPuzzle changes
  useEffect(() => {
    if (currentPuzzle && currentPuzzle.type == "Encode") {
      console.log("Setting guessBits, winBits, and judgment");
      const initialGuess = currentPuzzle.encoding.encodeText(currentPuzzle.init);
      setGuessBits(initialGuess);
      const newWinText = currentPuzzle.encoding.encodeText(currentPuzzle.winText);
      setWinBits(newWinText);
      setJudgment(new FullJudgment(false, "", []));
    }
  }, [currentPuzzle]);

  useEffect(() => {
      if (currentPuzzle && guessBits) {
        const newDisplayRows = currentPuzzle.encoding.splitForDisplay(guessBits, displayWidth);
        setDisplayRows(Array.from(newDisplayRows));
      }
    }, [currentPuzzle, guessBits, displayWidth]);

  const addBit = useCallback((bit: string) => {
    setGuessBits(previousGuessBits => {
      return previousGuessBits + bit;
    });
  }, []);

  const deleteBit = useCallback(() => {
    const shorterByOne = guessBits.slice(0, -1);
    setGuessBits(shorterByOne);
  }, [guessBits]);

  const updateBit = useCallback((bitRowIndex: number, bitIndex: number, newBitValue: string) => {
    const rowBits = displayRows[bitRowIndex].bits;
    const newRowBits = rowBits.slice(0, bitIndex) + newBitValue + rowBits.slice(bitIndex + 1);
    const newDisplayRowSplit = currentPuzzle?.encoding.splitForDisplay(newRowBits, displayWidth);
    const newDisplayRows = displayRows.slice(0, bitRowIndex);

    let newDisplayRow = newDisplayRowSplit?.next();
    while (newDisplayRow && !newDisplayRow.done) {
      newDisplayRows.push(newDisplayRow.value);
      newDisplayRow = newDisplayRowSplit?.next();
    }

    newDisplayRows.push(...displayRows.slice(bitRowIndex + 1));
    setDisplayRows(newDisplayRows);
    setGuessBits(newDisplayRows.map(displayRow => displayRow.bits).join(''));
  }, [displayRows, displayWidth, currentPuzzle?.encoding]);

  // Listen for key presses
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore key presses in input fields (text box)
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      } else {
        switch (event.key) {
          case "0":
            addBit("0");
            break;
          case "1":
            addBit("1");
            break;
          case "Backspace":
            deleteBit();
            event.preventDefault(); // Prevent the default back navigation in browsers
            break;
          default:
            break; // Ignore other keys
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [addBit, deleteBit]); // Depend on bits to ensure the latest state is used

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
      handleBitClick={handleBitClick}
      />
    <div className="encodingInputs">
      <p>
        <input type="button" className="bitInput" value="0" onClick={() => addBit("0")}/>
        <input type="button" className="bitInput" value="1" onClick={() => addBit("1")}/>
        <input type="button" className="bitInput" value="⌫" onClick={deleteBit}/>
      </p>
      <p>
        <input type="button" value="Submit" onClick={handleSubmitClick}/>
      </p>
    </div>
  </>;

  function handleBitClick(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event) {
      return;
    }

    const rowIndex = parseInt(event.currentTarget.getAttribute("data-sequence-index") || "0");
    const bitIndex = parseInt(event.currentTarget.getAttribute("data-bit-index") || "0");

    updateBit(rowIndex, bitIndex, event.currentTarget.checked ? "1" : "0");
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

export default EncodePuzzle;
