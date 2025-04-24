import React, {forwardRef, useImperativeHandle, useRef, useState} from "react";
import BitButton from "./BitButton.tsx";
import {SequenceJudgment} from "../judgment/SequenceJudgment.ts";
import { BitString } from "../encoding/BinaryEncoder.ts";

interface DisplayMatrixProps {
  bits: BitString;
  judgments: SequenceJudgment[];
  handleBitClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface DisplayMatrixUpdate {
  updateJudgment: (judgments: SequenceJudgment[]) => void;
  getWidth: () => number;
}

const DisplayMatrix = forwardRef<DisplayMatrixUpdate, DisplayMatrixProps>(
  ({bits, judgments, handleBitClick}, ref) => {
    const [currentJudgments, setCurrentJudgments] = useState(judgments);
    const bitFieldRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      updateJudgment(newJudgments: SequenceJudgment[]) {
        setCurrentJudgments(newJudgments);
      },
      getWidth: () => {
        return bitFieldRef.current?.offsetWidth ?? 0;
      }
    }));

    return (
      <>
        <div ref={bitFieldRef} id="bit-field">
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
