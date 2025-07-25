import { useBasePuzzle, PuzzleProps } from "./useBasePuzzle";
import { DisplayMatrix } from "./DisplayMatrix";

const BasePuzzle: React.FC<PuzzleProps> = (props) => {
  const { state, displayMatrixRef } = useBasePuzzle(props);
  const { currentPuzzle, displayRows, guessBits, judgment } = state;

  if (!currentPuzzle) return <></>;

  return (
    <>
      <DisplayMatrix
        key={`${currentPuzzle}-${guessBits}-${judgment}-${displayRows.length}`}
        displayRows={displayRows}
        judgments={judgment.sequenceJudgments}
        handleBitClick={() => {}}
      />
      <div className={"encodingInputs"}>
        <button type={"button"} onClick={props.onWin}>Check Answer</button>
      </div>
    </>
  );
};

export { BasePuzzle };
export type { PuzzleProps };
