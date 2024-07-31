import React from "react";
import FullJudgment from "../FullJudgment.ts";
import DisplayMatrix from "./DisplayMatrix.tsx";
import {SequenceJudgment} from "../SequenceJudgment.ts";
import BasePuzzle, {PuzzleProps, PuzzleState} from "./BasePuzzle.tsx";
import {Puzzle} from "../Menu.ts";
import VariableWidthEncoder from "../VariableWidthEncoder.ts";
import VariableWidthDecodingJudge from "../VariableWidthDecodingJudge.ts";
import FixedWidthEncoder from "../FixedWidthEncoder.ts";
import FixedWidthDecodingJudge from "../FixedWidthDecodingJudge.ts";

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

  handleGuessUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newGuessText = event.target.value.toUpperCase();
    this.setState({ guessText: newGuessText });
  };

  handleSubmitClick = () => {
    const { currentPuzzle, judge, guessBits, winBits } = this.state;
    if (!currentPuzzle || !judge) {
      console.error('Missing puzzle or judge');
      return;
    }
    const newJudgment = judge.judgeBits(guessBits, winBits, this.props.displayWidth);
    if (newJudgment) {
      if (newJudgment.isCorrect) {
        this.props.onWin?.();
      } else {
        this.setState({ judgment: newJudgment });
      }
    }
  };

  render() {
    const { currentPuzzle, guessBits, judgment, guessText } = this.state;

    return (
      <>
        <DisplayMatrix
          key={`${currentPuzzle?.init}-${guessBits}`}
          bits={this.state.winBits}
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
