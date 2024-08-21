import React, {forwardRef, useImperativeHandle, useState, useEffect} from "react";
import BitButton from "./BitButton.tsx";
import {SequenceJudgment} from "../judgment/SequenceJudgment.ts";

interface DisplayMatrixProps {
  bits: string;
  judgments: SequenceJudgment[];
  handleBitClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface DisplayMatrixHandle {
  updateJudgements: (judgments: SequenceJudgment[]) => void;
}

const DisplayMatrix = forwardRef<DisplayMatrixHandle, DisplayMatrixProps>((
    {
      bits,
      judgments,
      handleBitClick
    },
    ref
  ) => {
    const [currentJudgements, setCurrentJudgements] = useState(judgments);

    useEffect(() => {
      setCurrentJudgements(judgments);
    }, [judgments]);

    useImperativeHandle(ref, () => ({
      updateJudgements(newJudgments: SequenceJudgment[]) {
        setCurrentJudgements(newJudgments);
      }
    }));

    return (
      <>
        {currentJudgements.map((rowJudgment: SequenceJudgment, rowIndex: number) => (
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
      </>
    );
  }
);

export default DisplayMatrix;
export type {DisplayMatrixProps, DisplayMatrixHandle};
