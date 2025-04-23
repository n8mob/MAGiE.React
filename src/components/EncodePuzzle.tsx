import { PuzzleProps, PuzzleState } from "./BasePuzzle.tsx";
import DisplayMatrix from "./DisplayMatrix";
import BasePuzzle from "./BasePuzzle";
import React from "react";

class EncodePuzzle extends BasePuzzle<PuzzleProps, PuzzleState> {
  handleKeyDown(event: KeyboardEvent) {
    const { guessBits } = this.state;

    switch (event.key) {
      case "0":
      case "1":
        this.setState(
          { guessBits: guessBits + event.key }, // Append the bit
          () => this.updateJudgment() // Recheck win condition
        );
        break;

      case "Backspace":
        this.setState(
          { guessBits: guessBits.slice(0, -1) }, // Remove the last bit
          () => this.updateJudgment() // Recheck win condition
        );
        break;

      default:
        break; // Ignore other keys
    }
  }

  updateDisplayRows() {
    const {currentPuzzle, guessBits} = this.state;
    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return;
    }

    const displayRowSplit = currentPuzzle.encoding.splitForDisplay(guessBits, this.state.displayWidth);
    const newDisplayRows = [];
    let displayRow = displayRowSplit.next();
    while (displayRow && !displayRow.done) {
      newDisplayRows.push(displayRow.value);
      displayRow = displayRowSplit.next();
    }

    this.setState({displayRows: newDisplayRows});
  }

  updateJudgment() {
    const {currentPuzzle, judge, guessBits, winBits} = this.state;
    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return;
    }

    const splitter = (bits: string) => currentPuzzle.encoding.splitForDisplay(bits, this.state.displayWidth);
    const newJudgment = judge?.judgeBits(guessBits, winBits, splitter);
    if (newJudgment) {
      this.setState({judgment: newJudgment});
      this.displayMatrixRef.current?.updateJudgment(newJudgment.sequenceJudgments);
      if (newJudgment.isCorrect) {
        this.props.onWin();
      }
    }
  }

  handleBitClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { sequenceIndex, bitIndex } = event.target.dataset;
    if (sequenceIndex === undefined || bitIndex === undefined) {
      console.error("Missing sequenceIndex or bitIndex in dataset");
      return;
    }

    const index = parseInt(sequenceIndex) * this.state.displayWidth + parseInt(bitIndex);
    console.log(`${sequenceIndex} *  ${this.state.displayWidth} + ${bitIndex} = ${index}`)
    const { guessBits } = this.state;
    const updatedBits = guessBits.split('').map((bit, i) => (i === index ? (bit === '0' ? '1' : '0') : bit)).join('');
    this.setState({ guessBits: updatedBits }, () => this.updateJudgment());
  };

  render() {
    const {currentPuzzle, judgment} = this.state;

    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return <></>;
    }

    return (
      <>
        <div className="clue-and-bits">
          {[...currentPuzzle.clue].map((clueLine, clueIndex) => <p key={clueIndex}>{clueLine}</p>)}
          <DisplayMatrix
            ref={this.displayMatrixRef}
            bits={this.state.guessBits}
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

