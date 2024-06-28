import React, {useEffect, useState} from 'react';

interface Props {
  bits: string;
  encodingWidth: number;
}

const CheckboxMatrix: React.FC<Props> = ({bits, encodingWidth}) => {
  const [checkboxValues, setCheckboxValues] = useState<boolean[][]>([]);

  useEffect(() => {
    const data = Array.from(bits)
      .map(char => char === '1')  // '1' => true, everything else => false
      .reduce((rows, value, index) => {
        if (index % encodingWidth === 0) {
          rows.push([]);
        }
        rows[rows.length - 1].push(value);
        return rows;
      }, [] as boolean[][]);

    setCheckboxValues(data);
  }, [bits, encodingWidth]);

  const handleCheckboxChange = (rowIndex: number, colIndex: number) => {
    // Copy state array
    const newCheckboxValues = JSON.parse(JSON.stringify(checkboxValues));

    // Update value at given indices
    newCheckboxValues[rowIndex][colIndex] = !newCheckboxValues[rowIndex][colIndex];

    // Update state
    setCheckboxValues(newCheckboxValues);
  };

  return (
    <>
      {checkboxValues.map((row, rowIndex) => (
        <div key={rowIndex}>
          {row.map((isChecked, colIndex) => (
            <input
              key={colIndex}
              type="checkbox"
              className="bit-checkbox"
              checked={isChecked}
              onChange={() => handleCheckboxChange(rowIndex, colIndex)}
            />
          ))}
        </div>
      ))}
    </>
  );
}

export default CheckboxMatrix;
