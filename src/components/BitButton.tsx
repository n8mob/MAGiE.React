import { Correctness } from "../judgment/BitJudgment.ts";
import { IndexedBit } from "../IndexedBit.ts";
import * as React from "react";

interface BitButtonProps {
  bit: IndexedBit,
  key: string,
  correctness: Correctness,
  bitIndex: number,
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

const BitButton: React.FC<BitButtonProps> = (
  {
    bit,
    correctness,
    bitIndex,
    onChange,
  }) => {
  const isBitOn = bit.bit === "1";

  return (
    <>
      <input type="checkbox"
             className={"bit-checkbox"}
             onChange={onChange}
             checked={isBitOn}
             data-bit-index={bitIndex}
             data-correctness={correctness}
             key={`bit-${bitIndex}`}
      />
    </>
  );
}

export { BitButton };
