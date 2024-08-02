import React from "react";
import FullJudgment from "../judgment/FullJudgment.ts";
import DisplayMatrix from "./DisplayMatrix.tsx";
import {SequenceJudgment} from "../judgment/SequenceJudgment.ts";
import BasePuzzle, {PuzzleProps, PuzzleState} from "./BasePuzzle.tsx";
import {Puzzle} from "../Menu.ts";
import VariableWidthEncoder from "../encoding/VariableWidthEncoder.ts";
import VariableWidthDecodingJudge from "../judgment/VariableWidthDecodingJudge.ts";
import FixedWidthEncoder from "../encoding/FixedWidthEncoder.ts";
import FixedWidthDecodingJudge from "../judgment/FixedWidthDecodingJudge.ts";
import {DisplayRow} from "../encoding/BinaryEncoder.ts";

class DecodePuzzle extends BasePuzzle<PuzzleProps, PuzzleState> {
  constructor(props: PuzzleProps) {
    super(props);

    this.state = {
      currentPuzzle: props.puzzle,
      judge: null,
      guessText: "",
      guessBits: "",
      winBits: "",
      judgment: new FullJudgment<SequenceJudgment>(false, "", []),
      updating: false,
      displayRows: [],
    };
  }

  updateJudge(puzzle: Puzzle) {
    if (puzzle.encoding instanceof VariableWidthEncoder) {
      this.setState({judge: new VariableWidthDecodingJudge(puzzle.encoding)});
    } else if (puzzle.encoding instanceof FixedWidthEncoder) {
      this.setState({judge: new FixedWidthDecodingJudge(puzzle.encoding)});
    } else {
      console.error(`Unsupported encoding type: ${puzzle.encoding.getType()}, ${puzzle.encoding_name}`);
    }
  }

  componentDidUpdate(prevProps: PuzzleProps, prevState: PuzzleState) {
    if (
      prevState.winBits !== this.state.winBits
    ) {
      this.updateDisplayRows();
    }
    super.componentDidUpdate(prevProps, prevState);
  }

  updateDisplayRows() {
    const {currentPuzzle, winBits} = this.state;
    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return;
    }

    const displayRowSplit = currentPuzzle.encoding.splitForDisplay(winBits, this.props.displayWidth);
    const newDisplayRows: DisplayRow[] = [];
    let displayRow = displayRowSplit.next();
    while (displayRow && !displayRow.done) {
      newDisplayRows.push(displayRow.value);
      displayRow = displayRowSplit.next();
    }

    this.setState({displayRows: newDisplayRows});
  }

  updateJudgment() {
    const {currentPuzzle, judge, guessBits, winBits} = this.state;
    if (!currentPuzzle || !judge) {
      console.error('Missing puzzle or judge');
      return;
    }

    const splitter = (bits: string) => currentPuzzle.encoding.splitForDisplay(bits, this.props.displayWidth);
    const newJudgment = judge.judgeBits(guessBits, winBits, splitter);
    if (newJudgment) {
      this.setState({judgment: newJudgment});
    }
  }

  handleGuessUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newGuessText = event.target.value.toUpperCase();
    const newState = {
      guessText: newGuessText,
      guessBits: this.state.currentPuzzle?.encoding.encodeText(newGuessText) || "",
    }
    this.setState(newState);
  };

  handleSubmitClick = () => {
    const { currentPuzzle, judge, guessBits, winBits } = this.state;
    if (!currentPuzzle || !judge) {
      console.error('Missing puzzle or judge');
      return;
    }
    const splitter = (bits: string) => currentPuzzle.encoding.splitForDisplay(bits, this.props.displayWidth);
    const newJudgment = judge.judgeBits(guessBits, winBits, splitter);
    if (newJudgment) {
      if (newJudgment.isCorrect) {
        this.props.onWin?.();
        this.resetForNextPuzzle();
      } else {
        this.setState({ judgment: newJudgment });
      }
    }
  };

  render() {
    const { currentPuzzle, guessBits, judgment, guessText , winBits} = this.state;

    return (
      <>
        <DisplayMatrix
          key={`${winBits}-${currentPuzzle?.init}-${guessBits}`}
          bits={winBits}
          judgments={judgment.sequenceJudgments}
          decodedGuess={currentPuzzle?.encoding.decodeText(guessBits) || ""}
          handleBitClick={() => {}}  // bits will be read-only for the decode puzzle
        />
        <div className="encodingInputs">
          <p>
            <input type="text" value={guessText} onChange={this.handleGuessUpdate} />
          </p>
          <p>
            <input type="button" value="Submit" onClick={this.handleSubmitClick} />
          </p>
        </div>
      </>
    );
  }
}

export default DecodePuzzle;
