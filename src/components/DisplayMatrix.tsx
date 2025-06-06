import { ChangeEvent, forwardRef, useImperativeHandle, useRef, useState } from "react";
import { BitButton } from "./BitButton.tsx";
import { SequenceJudgment } from "../judgment/SequenceJudgment.ts";
import { DisplayRow } from "../encoding/DisplayRow.ts";
import { Correctness } from "../judgment/BitJudgment.ts";

interface DisplayMatrixProps {
  displayRows: DisplayRow[];
  judgments: SequenceJudgment[];
  handleBitClick: (event: ChangeEvent<HTMLInputElement>) => void;
}

interface DisplayMatrixUpdate {
  updateJudgment: (judgments: SequenceJudgment[]) => void;
  getWidth: () => number;
  scrollToBottom?: () => void;
  getBitRowElement?: (rowIndex: number) => HTMLElement | null;
}

const DisplayMatrix = forwardRef<DisplayMatrixUpdate, DisplayMatrixProps>(
  ({displayRows, judgments, handleBitClick}, ref) => {
    const [currentJudgments, setCurrentJudgments] = useState(judgments);
    const bitFieldRef = useRef<HTMLDivElement | null>(null);
    const rowRefs = useRef<(HTMLParagraphElement | null)[]>([]);

    useImperativeHandle(ref, () => ({
      updateJudgment(newJudgments: SequenceJudgment[]) {
        setCurrentJudgments(newJudgments);
      },
      getWidth: () => {
        return bitFieldRef.current?.offsetWidth ?? 0;
      },
      scrollToBottom: () => {
        if (bitFieldRef.current) {
          bitFieldRef.current.scrollTo({ top: bitFieldRef.current.scrollHeight, behavior: 'smooth' });
        }
      },
      getBitRowElement: (rowIndex: number) => {
        return rowRefs.current[rowIndex] || null;
      }
    }));

    return (
      <>
        <div ref={bitFieldRef} id="bit-field">
          {displayRows.map((displayRow, rowIndex) => (
            <p key={`row-${rowIndex}`} ref={el => rowRefs.current[rowIndex] = el}>
              {[...displayRow].map((bit, indexWithinRow) => (
                <BitButton
                  bit={bit}
                  key={`bit-${bit.index}`}
                  correctness={currentJudgments[rowIndex]?. bitJudgments?.[indexWithinRow]?.correctness || Correctness.incorrect}
                  onChange={handleBitClick}
                />
              ))}
              {displayRow.annotation && (
                <span className="annotation">{'\u00A0'}{displayRow.annotation}</span>
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
