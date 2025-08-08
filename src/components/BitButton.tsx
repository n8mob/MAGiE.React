import { Correctness } from "../judgment/BitJudgment.ts";
import { IndexedBit } from "../IndexedBit.ts";
import { ChangeEventHandler, MouseEventHandler } from "react";

interface BitButtonProps {
  bit: IndexedBit,
  key?: string,
  correctness: Correctness,
  onChange?: ChangeEventHandler<HTMLInputElement>,
  onClick?: MouseEventHandler<HTMLInputElement>
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
