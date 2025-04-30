import { Correctness } from "../judgment/BitJudgment.ts";
import { IndexedBit } from "../IndexedBit.ts";
import * as React from "react";

interface BitButtonProps {
  bit: IndexedBit,
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
  const isBitOn = bit.bit === "1";

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
             key={`bit-${bitIndex}`}
      />
    </>
  );
}

export default BitButton;
