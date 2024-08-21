import React, {useCallback, useEffect, useState} from "react";
import DisplayMatrix from "./DisplayMatrix.tsx";
import {Puzzle} from "../Menu.ts";
import VariableWidthEncoder from "../encoding/VariableWidthEncoder.ts";
import VariableWidthEncodingJudge from "../judgment/VariableWidthEncodingJudge.ts";
import FixedWidthEncoder from "../encoding/FixedWidthEncoder.ts";
import FixedWidthEncodingJudge from "../judgment/FixedWidthEncodingJudge.ts";
import {DisplayRow} from "../encoding/BinaryEncoder.ts";
import usePuzzle from "../hooks/usePuzzle.ts";

const EncodePuzzle: React.FC<{ puzzle: Puzzle; displayWidth: number; onWin: () => void }> = ({ puzzle, displayWidth, onWin }) => {
  const [displayRows, setDisplayRows] = useState<DisplayRow[]>([]);

  const updateJudge = (puzzle: Puzzle) => {
    if (puzzle.encoding instanceof VariableWidthEncoder) {
      setJudge(new VariableWidthEncodingJudge(puzzle.encoding));
    } else if (puzzle.encoding instanceof FixedWidthEncoder) {
      setJudge(new FixedWidthEncodingJudge(puzzle.encoding));
    } else {
      console.error(`Unsupported encoding type: ${puzzle.encoding.getType()}, ${puzzle.encoding_name}`);
    }
  };

  const {
    currentPuzzle,
    judgment,
    guessBits,
    setGuessBits,
    setJudge,
    displayMatrixRef,
    handleSubmitClick
  } = usePuzzle({
    puzzle,
    displayWidth,
    onWin,
    onUpdateJudge: updateJudge
  });

  const addBit = useCallback((bit: string) => {
    setGuessBits(prevBits => prevBits + bit);
  }, [setGuessBits]);

  const deleteBit = useCallback(() => {
    setGuessBits(prevBits => prevBits.slice(0, -1));
  }, [setGuessBits]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case "0":
        addBit("0");
        break;
      case "1":
        addBit("1");
        break;
      case "Backspace":
        deleteBit();
        break;
      case "Enter":
        handleSubmitClick();
        break;
      default:
        break;
    }
  }, [addBit, deleteBit, handleSubmitClick]);

  const updateBit = (rowIndex: number, bitIndex: number, bit: string) => {
    if (!displayRows || displayRows.length === 0) {
      console.error('Missing display rows');
      return;
    }

    const rowBits = displayRows[rowIndex].bits;
    const newRowBits = rowBits.slice(0, bitIndex) + bit + rowBits.slice(bitIndex + 1);
    const newDisplayRowSplit = currentPuzzle?.encoding.splitForDisplay(newRowBits, displayWidth);
    const newDisplayRows = displayRows.slice(0, rowIndex);

    let newDisplayRow = newDisplayRowSplit?.next();
    while (newDisplayRow && !newDisplayRow.done) {
      newDisplayRows.push(newDisplayRow.value);
      newDisplayRow = newDisplayRowSplit?.next();
    }

    newDisplayRows.push(...displayRows.slice(rowIndex + 1));
    setDisplayRows(newDisplayRows);
    setGuessBits(newDisplayRows.map(displayRow => displayRow.bits).join(''));
  };

  const handleBitClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event) {
      return;
    }

    const rowIndex = parseInt(event.currentTarget.getAttribute("data-sequence-index") || "0");
    const bitIndex = parseInt(event.currentTarget.getAttribute("data-bit-index") || "0");

    updateBit(rowIndex, bitIndex, event.currentTarget.checked ? "1" : "0");
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!currentPuzzle) {
    console.error('Missing puzzle');
    return <></>;
  }

  return (
    <>
      <DisplayMatrix
        ref={displayMatrixRef}
        bits={guessBits}
        judgments={judgment.sequenceJudgments}
        handleBitClick={handleBitClick}
      />
      <div className="encodingInputs">
        <p>
          <input type="button" className="bitInput" value="0" onClick={() => addBit("0")} />
          <input type="button" className="bitInput" value="1" onClick={() => addBit("1")} />
          <input type="button" className="bitInput" value="⌫" onClick={deleteBit} />
        </p>
        <p>
          <input type="button" value="Submit" onClick={handleSubmitClick} />
        </p>
      </div>
    </>
  );
};

export default EncodePuzzle;
