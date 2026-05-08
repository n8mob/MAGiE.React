import { Correctness } from "../judgment/BitJudgment.ts";
import { IndexedBit } from "../IndexedBit.ts";
import { ChangeEventHandler, MouseEventHandler } from "react";

interface BitButtonProps {
  bit: IndexedBit;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onClick?: MouseEventHandler<HTMLInputElement>;
}

const BitButton: React.FC<BitButtonProps> = (
  {
    bit,
    onChange = () => {},
    onClick = () => {},
  }) => (
  <input
    type="checkbox"
    className="bit-checkbox"
    onChange={onChange}
    onClick={onClick}
    checked={bit.bit === "1"}
    data-bit-index={bit.index}
    key={`bit-${bit.index}`}
  />
);

interface CorrectnessBitButtonProps extends BitButtonProps {
  correctness: Correctness;
}

const CorrectnessBitButton: React.FC<CorrectnessBitButtonProps> = (
  {
    bit,
    correctness,
    onChange = () => {},
    onClick = () => {},
  }) => (
  <input
    type="checkbox"
    className="bit-checkbox"
    onChange={onChange}
    onClick={onClick}
    checked={bit.bit === "1"}
    data-correctness={correctness}
    data-bit-index={bit.index}
    key={`bit-${bit.index}`}
  />
);

export { BitButton, CorrectnessBitButton };
export type { BitButtonProps, CorrectnessBitButtonProps };