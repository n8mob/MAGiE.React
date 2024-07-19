import React from "react";

interface BitButtonProps {
  bit: string,
  isCorrect: boolean,
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

const BitButton: React.FC<BitButtonProps> = ({bit, isCorrect, onChange}) => {
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
      <label className={className}></label>
      <input type="checkbox" checked={isBitOn} onChange={onChange}/>
      <span></span> {/* This span is used for custom checkbox styling */}
    </>
  );
}

export default BitButton;
