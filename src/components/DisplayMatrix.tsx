import { forwardRef, ReactNode, useImperativeHandle, useRef } from "react";
import { DisplayRow } from "../encoding/DisplayRow.ts";
import { IndexedBit } from "../IndexedBit.ts";

interface DisplayMatrixProps {
  displayRows: DisplayRow[];
  renderBit: (bit: IndexedBit, rowIndex: number, indexWithinRow: number) => ReactNode;
  /** Show each row's decoded-character annotation. Off for decode puzzles, where it would reveal the answer. */
  showAnnotations?: boolean;
  /** Optional class for a row's <p>, e.g. per-letter correctness or focus styling in Chocolate mode. */
  rowClassName?: (rowIndex: number) => string | undefined;
}

interface DisplayMatrixUpdate {
  getWidth: () => number;
  scrollToBottom?: () => void;
  getBitRowElement?: (rowIndex: number) => HTMLElement | null;
}

const DisplayMatrix = forwardRef<DisplayMatrixUpdate, DisplayMatrixProps>(
  ({ displayRows, renderBit, showAnnotations = true, rowClassName }, ref) => {
    const bitFieldRef = useRef<HTMLDivElement | null>(null);
    const rowRefs = useRef<(HTMLParagraphElement | null)[]>([]);

    useImperativeHandle(ref, () => ({
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
        <div ref={bitFieldRef} className="bit-field">
          {displayRows.map((displayRow, rowIndex) => (
            <p key={`row-${rowIndex}`}
               className={rowClassName?.(rowIndex) || undefined}
               ref={el => { rowRefs.current[rowIndex] = el; }}>
              {[...displayRow].map((bit, indexWithinRow) => (
                renderBit(
                  bit,
                  rowIndex,
                  indexWithinRow
                )
              ))}
              {showAnnotations && displayRow.annotation && (
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
