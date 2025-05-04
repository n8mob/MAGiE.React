import { ChangeEvent, forwardRef, useImperativeHandle, useRef, useState } from "react";
import { BitButton } from "./BitButton.tsx";
import { SequenceJudgment } from "../judgment/SequenceJudgment.ts";
import { DisplayRow } from "../encoding/DisplayRow.ts";

interface DisplayMatrixProps {
  displayRows: DisplayRow[];
  judgments: SequenceJudgment[];
  handleBitClick: (event: ChangeEvent<HTMLInputElement>) => void;
}

interface DisplayMatrixUpdate {
  updateJudgment: (judgments: SequenceJudgment[]) => void;
  getWidth: () => number;
}

const DisplayMatrix = forwardRef<DisplayMatrixUpdate, DisplayMatrixProps>(
  ({displayRows, judgments, handleBitClick}, ref) => {
    const [currentJudgments, setCurrentJudgments] = useState(judgments);
    const bitFieldRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({
      updateJudgment(newJudgments: SequenceJudgment[]) {
        setCurrentJudgments(newJudgments);
      },
      getWidth: () => {
        return bitFieldRef.current?.offsetWidth ?? 0;
      }
    }));

    return (
      <>
        <div ref={bitFieldRef} id="bit-field">
          {displayRows.map((displayRow, rowIndex) => (
            <p key={`row-${rowIndex}`}>
              {[...displayRow].map((bit, indexWithinRow) => (
                  <BitButton
                    bit={bit}
                    bitIndex={bit.index}
                    isCorrect={currentJudgments[rowIndex].bitJudgments[indexWithinRow].isCorrect}
                    onChange={handleBitClick}
                  />
                )
              )}
            </p>
          ))}
        </div>
      </>
    );
  }
);

export { DisplayMatrix };
export type { DisplayMatrixProps, DisplayMatrixUpdate };
