import React from "react";

interface BitButtonProps {
  bit: string,
  rowIndex: number,
  bitIndex: number,
  isCorrect: boolean,
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

const BitButton: React.FC<BitButtonProps> = ({bit, rowIndex, bitIndex, isCorrect, onChange}) => {
  let className = "bit-checkbox bit-button";
  const isBitOn = bit === "1";
  if (isBitOn) {
    className += " bit-on";
  }

  if (isCorrect) {
    className += " bit-correct";
  } else {
    className += " bit-incorrect";
  }

  return (
    <>
      <input type="checkbox"
             className={className}
             checked={isBitOn}
             onChange={onChange}
             data-row-index={rowIndex}
             data-bit-index={bitIndex}
      />
    </>
  );
}

export default BitButton;
