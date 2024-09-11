import React, {forwardRef, useImperativeHandle, useState} from "react";
import BitButton from "./BitButton.tsx";
import {SequenceJudgment} from "../judgment/SequenceJudgment.ts";

interface DisplayMatrixProps {
  bits: string;
  judgments: SequenceJudgment[];
  handleBitClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface DisplayMatrixUpdate {
  updateJudgment: (judgments: SequenceJudgment[]) => void;
}

const DisplayMatrix = forwardRef<DisplayMatrixUpdate, DisplayMatrixProps>(
  ({bits, judgments, handleBitClick}, ref) => {
    const [currentJudgments, setCurrentJudgments] = useState(judgments);

    useImperativeHandle(ref, () => ({
      updateJudgment(newJudgments: SequenceJudgment[]) {
        setCurrentJudgments(newJudgments);
      }
    }));

    return (
      <>
        <div id="bit-field">
          {currentJudgments.map((rowJudgment: SequenceJudgment, rowIndex: number) => (
            <p key={`row${rowIndex}`}>
              {rowJudgment.bitJudgments.map((bitJudgment, bitRowIndex) => {
                const key = `${rowIndex}-${bitRowIndex}-${bitJudgment.bit}-${bitJudgment.isCorrect}-${bits.length}`;
                return (
                  <BitButton
                    key={key}
                    bit={bitJudgment.bit}
                    sequenceIndex={rowIndex}
                    bitIndex={bitJudgment.bitIndex}
                    isCorrect={bitJudgment.isCorrect}
                    onChange={handleBitClick}
                  />
                );
              })}
            </p>
          ))}
        </div>
      </>
    );
  }
);

export default DisplayMatrix;
export type {DisplayMatrixUpdate};
