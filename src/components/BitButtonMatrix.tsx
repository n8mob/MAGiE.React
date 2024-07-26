import React from "react";
import BitButton from "./BitButton.tsx";
import {SequenceJudgment} from "../SequenceJudgment.ts";

interface BitButtonMatrixProps {
  guessBits: string;
  judgment: SequenceJudgment[];
  handleBitClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const BitButtonMatrix: React.FC<BitButtonMatrixProps> = ({guessBits, judgment, handleBitClick}) => {
  return (
    <div className="display">
      {[...judgment].map((rowJudgment: SequenceJudgment, rowIndex: number) => {
        return <p key={`row${rowIndex}`}>
          {[...rowJudgment.bitJudgments].map((bitJudgment, bitRowIndex) => {
            const key = `${rowIndex}-${bitRowIndex}-${bitJudgment.bit}-${bitJudgment.isCorrect}-${guessBits.length}`;
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
    </div>
  );
}

export default BitButtonMatrix;
