import { PuzzleProps, PuzzleState } from "./BasePuzzle.tsx";
import { DisplayMatrix } from "./DisplayMatrix";
import { BasePuzzle } from "./BasePuzzle";
import { ChangeEvent } from "react";
import { DisplayRow } from "../encoding/DisplayRow.ts";

class EncodePuzzle extends BasePuzzle {
  constructor(props: PuzzleProps) {
    super(props);
  }

  handleKeyDown(event: KeyboardEvent) {
    const {guessBits} = this.state;

    switch (event.key) {
      case "0":
      case "1":
        this.setState(
          {guessBits: guessBits.appendBit(event.key)} as PuzzleState, // Append the bit
          () => this.updateJudgment() // Recheck win condition
        );
        break;

      case "Backspace":
        this.setState(
          {guessBits: guessBits.slice(0, -1)} as PuzzleState, // Remove the last bit
          () => this.updateJudgment() // Recheck win condition
        );
        break;
      default:
        break; // Ignore other keys
    }
  }

  handleBitClick = (event: ChangeEvent<HTMLInputElement>) => {
    const {bitIndex} = event.target.dataset;
    const {guessBits} = this.state;
    console.log(`guess state: ${guessBits.toString()}`);

    if (bitIndex === undefined) {
      console.error("Missing bitIndex in dataset");
      return;
    }

    const index = parseInt(bitIndex);
    const before = guessBits.toPlainString().slice(0, index);
    const toToggle = guessBits.slice(index, index + 1);
    const didToggle = toToggle.toPlainString() === "1" ? "0" : "1";
    const after = guessBits.slice(index + 1);
    const toggled = guessBits.toggleBit(index);

    console.log(`toggle ${before}[${toToggle}/${didToggle}]${after}`);
    this.setState(
      { guessBits: toggled } as PuzzleState,
      () => this.updateJudgment()
    );
  };

  *splitForDisplay(displayWidth: number): Generator<DisplayRow, void> {
    if (!this.state.currentPuzzle) {
      return;
    }

    yield* this.state.currentPuzzle.encoding.splitForDisplay(this.state.guessBits, displayWidth);
  }

  render() {
    const {currentPuzzle, displayRows, judgment} = this.state;

    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return <></>;
    }

    return (
      <>
        <div className="main-display">
          {[...currentPuzzle.clue].map((clueLine, clueIndex) => <p key={clueIndex}>{clueLine}</p>)}
          <DisplayMatrix
            ref={this.displayMatrixRef}
            displayRows={displayRows}
            judgments={judgment.sequenceJudgments}
            handleBitClick={this.handleBitClick}
          />
          {judgment.isCorrect && [...currentPuzzle.winMessage].map((winLine, winIndex) => <p
            key={`win-text-${winIndex}`}>{winLine}</p>)}
        </div>
        <div className="puzzle-inputs">
          <p>Type "0" or "1" to input bits. Use "Backspace" to delete.</p>
        </div>
      </>
    );
  }
}

export default EncodePuzzle;

