import React from "react";

interface BitButtonProps {
  bit: string,
  rowIndex: number,
  bitIndex: number,
  isCorrect: boolean,
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

const BitButton: React.FC<BitButtonProps> = ({bit, rowIndex, bitIndex, isCorrect, onChange}) => {
  const isBitOn = bit === "1";

  return (
    <>
      <input type="checkbox"
             className={"bit-checkbox"}
             onChange={onChange}
             checked={isBitOn}
             data-bit-value={bit}
             data-judgment={isCorrect ? "correct" : "incorrect"}
             data-row-index={rowIndex}
             data-bit-index={bitIndex}
      />
    </>
  );
}

export default BitButton;
