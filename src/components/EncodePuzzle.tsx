import {Puzzle} from "../Menu.ts";
import React, {useEffect, useState, useCallback} from "react";
import FullJudgment from "../FullJudgment.ts";
import BitButton from "./BitButton.tsx";
import {DisplayRow} from "../BinaryEncoder.ts";
import {SequenceJudgment} from "../SequenceJudgment.ts";

interface EncodePuzzleProps {
  puzzle?: Puzzle;
  displayWidth: number;
  onWin: () => void;
}

const EncodePuzzle: React.FC<EncodePuzzleProps> = ({puzzle, displayWidth, onWin}) => {
  const [guessBits, setGuessBits] = useState("");
  const [winBits, setWinBits] = useState<string>("");
  const [judgment, setJudgment] = useState(new FullJudgment<SequenceJudgment>(false, "", []));
  const [displayRows, setDisplayRows] = useState<DisplayRow[]>([]);

  // initialize guessBits and winBits when the puzzle changes
  useEffect(() => {
    if (puzzle && puzzle.type == "Encode") {
      setGuessBits(puzzle.encoding.encodeText(puzzle.init));
      setWinBits(puzzle.encoding.encodeText(puzzle.winText));
      setJudgment(new FullJudgment(false, "", []));
    }
  }, [puzzle]);

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
    const newDisplayRowSplit = puzzle?.encoding.splitForDisplay(newRowBits, displayWidth);
    const newDisplayRows = displayRows.slice(0, bitRowIndex);

    let newDisplayRow = newDisplayRowSplit?.next();
    while (newDisplayRow && !newDisplayRow.done) {
      newDisplayRows.push(newDisplayRow.value);
      newDisplayRow = newDisplayRowSplit?.next();
    }

    newDisplayRows.push(...displayRows.slice(bitRowIndex + 1));
    setDisplayRows(newDisplayRows);

    setGuessBits(newDisplayRows.map(displayRow => displayRow.bits).join(''));
  }, [displayRows, displayWidth, puzzle?.encoding]);

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
    if (puzzle && guessBits && winBits) {
      const judgment = puzzle?.encoding.judgeBits(
        guessBits,
        puzzle.encoding.encodeText(puzzle.winText),
        displayWidth
      );

      if (judgment) {
        setJudgment(judgment);
      }
    }
  }, [puzzle, guessBits, winBits, displayWidth]);

  // Update displayRows when guessBits changes
  useEffect(() => {
    if (puzzle && guessBits) {
      const splitRows = puzzle.encoding.splitForDisplay(guessBits, displayWidth);
      let nextRow = splitRows?.next();
      const newBitsByChar: DisplayRow[] = [];
      while (!nextRow.done) {
        console.log("next row of bits", nextRow.value.bits);
        newBitsByChar.push(nextRow.value);
        nextRow = splitRows?.next();
      }
      setDisplayRows(newBitsByChar);
    }
  }, [puzzle, guessBits, displayWidth]);

  return <>
    <div className="display">
      {[...judgment.sequenceJudgments].map((rowJudgment: SequenceJudgment, rowIndex: number) => {
          return <p key={`row${rowIndex}`}>
            {[...rowJudgment.bitJudgments].map((bitJudgment, bitRowIndex) => {
              return (
                <BitButton
                  key={`${rowIndex}-${bitRowIndex}`}
                  bit={bitJudgment.bit}
                  sequenceIndex={bitJudgment.sequenceIndex}
                  bitIndex={bitJudgment.bitIndex}
                  isCorrect={bitJudgment.isCorrect}
                  onChange={handleBitClick}
                />);
            })}
          </p>;
        }
      )
      }
    </div>
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

    const rowIndex = parseInt(event.currentTarget.getAttribute("data-row-index") || "0");
    const bitIndex = parseInt(event.currentTarget.getAttribute("data-bit-index") || "0");

    updateBit(rowIndex, bitIndex, event.currentTarget.checked ? "1" : "0");
  }

  function handleSubmitClick() {
    if (!puzzle) {
      console.error('Missing puzzle');
      return;
    } else {
      const newJudgment = puzzle.encoding.judgeBits(guessBits, winBits, displayWidth);
      if (newJudgment.isCorrect) {
        onWin?.();
      } else {
        setJudgment(newJudgment);
      }
    }
  }
}

export default EncodePuzzle;
