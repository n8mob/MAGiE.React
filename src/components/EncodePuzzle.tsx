import {Puzzle} from "../Menu.ts";
import React, {useEffect, useState, useCallback} from "react";
import FullJudgment from "../FullJudgment.ts";
import {Bits} from "../CharJudgment.ts";
import BitButton from "./BitButton.tsx";

interface EncodePuzzleProps {
  puzzle?: Puzzle;
  onWin: () => void;
}

const EncodePuzzle: React.FC<EncodePuzzleProps> = ({puzzle, onWin}) => {
  const [guessBits, setGuessBits] = useState("");
  const [winBits, setWinBits] = useState<string>("");
  const [judgment, setJudgment] = useState(new FullJudgment<Bits>(false, "", []));
  const [bitRows, setBitRows] = useState<string[]>([]);

  // initialize guessBits and winBits when the puzzle changes
  useEffect(() => {
    if (puzzle && puzzle.type == "Encode") {
      setGuessBits(puzzle.encoding.encodeText(puzzle.init));
      setWinBits(puzzle.encoding.encodeText(puzzle.winText));
    }
  }, [puzzle]);

  const addBit = useCallback((bit: string) => {
    setGuessBits(previousGuessBits => {
      return previousGuessBits + bit;
    });
  }, []);

  const deleteBit = useCallback(() => {
    setGuessBits(guessBits.slice(0, -1));
  }, [guessBits]);

  const updateBit = useCallback((bitRowIndex: number, bitIndex: number, newBitValue: string) => {
    const prevCharBits = [...bitRows[bitRowIndex]];
    prevCharBits[bitIndex] = newBitValue;
    bitRows[bitRowIndex] = prevCharBits.join('');
    setGuessBits(bitRows.join(''));
  }, [bitRows]);

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
      const judgment = puzzle?.encoding.judgeBits(guessBits, puzzle.encoding.encodeText(puzzle.winText));
      if (judgment) {
        setJudgment(judgment);
      }
    }
  }, [puzzle, guessBits, winBits]);

  // Update bitsByChar when guessBits changes
  useEffect(() => {
    if (puzzle && guessBits) {
      const splitRows = puzzle.encoding.splitForDisplay(guessBits, 13);
      let nextRow = splitRows?.next();
      const newBitsByChar: string[] = [];
      while (!nextRow.done) {
        console.log("next row of bits", nextRow.value.display);
        newBitsByChar.push(nextRow.value.display);
        nextRow = splitRows?.next();
      }
      setBitRows(newBitsByChar);
    }
  }, [puzzle, guessBits]);

  return <>
    <div className="encodingInputs stickyContainer">
      <p>
        <input type="button" className="bitInput" value="0" onClick={() => addBit("0")}/>
        <input type="button" className="bitInput" value="1" onClick={() => addBit("1")}/>
        <input type="button" className="bitInput" value="⌫" onClick={deleteBit}/>
      </p>
    </div>
    {bitRows.map((rowBits: string, rowIndex: number) => {
        let isCharCorrect = false;
        if (judgment && judgment.charJudgments && judgment.charJudgments.length > rowIndex) {
          isCharCorrect = judgment.charJudgments[rowIndex].isCharCorrect;
        }

        return <p key={`char${rowIndex}`}>
          {[...rowBits].map((bit, bitIndex) => (
            <BitButton
              key={`${rowIndex}-${bitIndex}`}
              bit={bit}
              rowIndex={rowIndex}
              bitIndex={bitIndex}
              isCorrect={isCharCorrect}
              onChange={handleBitClick}
            />))}
        </p>;
      }
    )
    }
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

    const charIndex = parseInt(event.currentTarget.getAttribute("data-char-index") || "0");
    const bitIndex = parseInt(event.currentTarget.getAttribute("data-bit-index") || "0");

    updateBit(charIndex, bitIndex, event.currentTarget.checked ? "1" : "0");
  }

  function handleSubmitClick() {
    if (!puzzle) {
      console.error('Missing puzzle');
      return;
    } else {
      const newJudgment = puzzle.encoding.judgeBits(guessBits, winBits);
      if (newJudgment.isCorrect) {
        onWin?.();
      } else {
        setJudgment(newJudgment);
      }
    }
  }
}

export default EncodePuzzle;
