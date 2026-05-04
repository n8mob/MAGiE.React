import { forwardRef, ReactNode, useImperativeHandle, useRef, useState } from "react";
import { SequenceJudgment } from "../judgment/SequenceJudgment.ts";
import { DisplayRow } from "../encoding/DisplayRow.ts";
import { IndexedBit } from "../IndexedBit.ts";

interface DisplayMatrixProps {
  displayRows: DisplayRow[];
  judgments: SequenceJudgment[];
  renderBit: (bit: IndexedBit, rowIndex: number, indexWithinRow: number) => ReactNode;
}

interface DisplayMatrixUpdate {
  updateJudgment: (judgments: SequenceJudgment[]) => void;
  getWidth: () => number;
  scrollToBottom?: () => void;
  getBitRowElement?: (rowIndex: number) => HTMLElement | null;
}

const DisplayMatrix = forwardRef<DisplayMatrixUpdate, DisplayMatrixProps>(
  ({displayRows, judgments, renderBit}, ref) => {
    const [, setCurrentJudgments] = useState(judgments);
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
            <p key={`row-${rowIndex}`} ref={el => { rowRefs.current[rowIndex] = el; }}>
              {[...displayRow].map((bit, indexWithinRow) => (
                renderBit(
                  bit,
                  rowIndex,
                  indexWithinRow
                )
              ))}
              {displayRow.annotation && (
                <span className="annotation">{' '}{displayRow.annotation}</span>
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
