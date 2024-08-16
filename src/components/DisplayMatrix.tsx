import React from "react";
import BitButton from "./BitButton.tsx";
import {SequenceJudgment} from "../judgment/SequenceJudgment.ts";

interface BitButtonMatrixProps {
  bits: string;
  judgments: SequenceJudgment[];
  handleBitClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const DisplayMatrix: React.FC<BitButtonMatrixProps> = (
  {
    bits,
    judgments,
    handleBitClick
  }) => {
  return (
    <>
      {
        [...judgments].map((rowJudgment: SequenceJudgment, rowIndex: number) => {
          return <p key={`row${rowIndex}`}>
            {[...rowJudgment.bitJudgments].map((bitJudgment, bitRowIndex) => {
              const key = `${rowIndex}-${bitRowIndex}-${bitJudgment.bit}-${bitJudgment.isCorrect}-${bits.length}`;
              return (
                <BitButton
                  key={key}
                  bit={bitJudgment.bit}
                  sequenceIndex={rowIndex}
                  bitIndex={bitJudgment.bitIndex}
                  isCorrect={bitJudgment.isCorrect}
                  onChange={handleBitClick}
                />);
            })}
          </p>;
        })}
    </>
  );
}

export default DisplayMatrix;
