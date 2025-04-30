import { ChangeEvent, forwardRef, useImperativeHandle, useRef, useState } from "react";
import BitButton from "./BitButton.tsx";
import { SequenceJudgment } from "../judgment/SequenceJudgment.ts";
import { BitSequence } from "../BitSequence.ts";

interface DisplayMatrixProps {
  bits: BitSequence;
  judgments: SequenceJudgment[];
  handleBitClick: (event: ChangeEvent<HTMLInputElement>) => void;
}

interface DisplayMatrixUpdate {
  updateJudgment: (judgments: SequenceJudgment[]) => void;
  getWidth: () => number;
}

const DisplayMatrix = forwardRef<DisplayMatrixUpdate, DisplayMatrixProps>(
  ({judgments, handleBitClick}, ref) => {
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
          {currentJudgments.map((rowJudgment: SequenceJudgment, rowIndex: number) => (
            <p key={`row${rowIndex}`}>
              {rowJudgment.bitJudgments.map((bitJudgment) => {
                return (
                  <BitButton
                    bit={bitJudgment}
                    sequenceIndex={rowIndex}
                    bitIndex={bitJudgment.index}
                    isCorrect={bitJudgment.isCorrect}
                    onChange={handleBitClick}
                  />
                );
              })}
            </p>
          ))}
        </div>
      </>
    );
  }
);

export { DisplayMatrix };
export type { DisplayMatrixProps, DisplayMatrixUpdate };
