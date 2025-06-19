import { Correctness } from "../judgment/BitJudgment.ts";
import { IndexedBit } from "../IndexedBit.ts";
import * as React from "react";

interface BitButtonProps {
  bit: IndexedBit,
  key?: string,
  correctness: Correctness,
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onClick?: React.MouseEventHandler<HTMLInputElement>
}

const BitButton: React.FC<BitButtonProps> = (
  {
    bit,
    correctness,
    onChange = () => { },
    onClick = () => { },
  }) => {
  const isBitOn = bit.bit === "1";

  return (
    <>
      <input type="checkbox"
             className={"bit-checkbox"}
             onChange={onChange}
             onClick={onClick}
             checked={isBitOn}
             data-correctness={correctness}
             key={`bit-${bit.index}`}
      />
    </>
  );
}

export { BitButton };
