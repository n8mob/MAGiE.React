import React from "react";
import {Correctness} from "../BitJudgment.ts";

interface BitButtonProps {
  bit: string,
  isCorrect: Correctness,
  bitIndex: number,
  sequenceIndex: number | null,
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

const BitButton: React.FC<BitButtonProps> = (
  {
    bit,
    isCorrect,
    bitIndex,
    onChange,
    sequenceIndex = null
  }) => {
  const isBitOn = bit === "1";

  return (
    <>
      <input type="checkbox"
             className={"bit-checkbox"}
             onChange={onChange}
             checked={isBitOn}
             data-bit-value={bit}
             data-judgment={isCorrect == true ? "correct" : isCorrect == false ? "incorrect" : "unknown"}
             data-sequence-index={sequenceIndex}
             data-bit-index={bitIndex}
      />
    </>
  );
}

export default BitButton;
