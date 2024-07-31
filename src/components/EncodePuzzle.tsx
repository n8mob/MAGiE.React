import React from "react";
import FullJudgment from "../FullJudgment.ts";
import DisplayMatrix from "./DisplayMatrix.tsx";
import {DisplayRow} from "../encoding/BinaryEncoder.ts";
import {SequenceJudgment} from "../SequenceJudgment.ts";
import BasePuzzle, {PuzzleProps, PuzzleState} from "./BasePuzzle.tsx";
import VariableWidthEncodingJudge from "../VariableWidthEncodingJudge.ts";
import {Puzzle} from "../Menu.ts";
import VariableWidthEncoder from "../encoding/VariableWidthEncoder.ts";
import FixedWidthEncodingJudge from "../FixedWidthEncodingJudge.ts";
import FixedWidthEncoder from "../encoding/FixedWidthEncoder.ts";

interface EncodePuzzleProps extends PuzzleProps {}

interface EncodePuzzleState extends PuzzleState {
  displayRows: DisplayRow[];
}

class EncodePuzzle extends BasePuzzle<EncodePuzzleProps, EncodePuzzleState> {
  constructor(props: EncodePuzzleProps) {
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
      this.setState({judge: new VariableWidthEncodingJudge(puzzle.encoding)});
    } else if (puzzle.encoding instanceof FixedWidthEncoder) {
      this.setState({judge: new FixedWidthEncodingJudge(puzzle.encoding)});
    } else {
      console.error(`Unsupported encoding type: ${puzzle.encoding.getType()}, ${puzzle.encoding_name}`);
    }
  }

  addBit = (bit: string) => {
    this.setState((prevState: PuzzleState) => ({
      guessBits: prevState.guessBits + bit,
    }));
  };

  deleteBit = () => {
    this.setState((prevState: PuzzleState) => ({
      guessBits: prevState.guessBits.slice(0, -1),
    }));
  };

  updateBit = (rowIndex: number, bitIndex: number, bit: string) => {
    const { displayRows, currentPuzzle } = this.state;
    const rowBits = displayRows[rowIndex].bits;
    const newRowBits = rowBits.slice(0, bitIndex) + bit + rowBits.slice(bitIndex + 1);
    const newDisplayRowSplit = currentPuzzle?.encoding.splitForDisplay(newRowBits, this.props.displayWidth);
    const newDisplayRows = displayRows.slice(0, rowIndex);

    let newDisplayRow = newDisplayRowSplit?.next();
    while (newDisplayRow && !newDisplayRow.done) {
      newDisplayRows.push(newDisplayRow.value);
      newDisplayRow = newDisplayRowSplit?.next();
    }

    newDisplayRows.push(...displayRows.slice(rowIndex + 1));
    this.setState({
      displayRows: newDisplayRows,
      guessBits: newDisplayRows.map(displayRow => displayRow.bits).join(''),
    });
  };

  handleBitClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event) {
      return;
    }

    const rowIndex = parseInt(event.currentTarget.getAttribute("data-sequence-index") || "0");
    const bitIndex = parseInt(event.currentTarget.getAttribute("data-bit-index") || "0");

    this.updateBit(rowIndex, bitIndex, event.currentTarget.checked ? "1" : "0");
  };

  handleSubmitClick = () => {
    const { currentPuzzle, guessBits, winBits } = this.state;
    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return;
    } else {
      const newJudgment = this.state.judge?.judgeBits(guessBits, winBits, this.props.displayWidth);
      if (newJudgment && newJudgment.isCorrect) {
        this.setState({ judgment: newJudgment });
      }
    }
  };

  render() {
    const { currentPuzzle, guessBits, judgment} = this.state;

    return (
      <>
        <DisplayMatrix
          key={`${currentPuzzle?.init}-${guessBits}`}
          bits={guessBits}
          judgments={judgment.sequenceJudgments}
          decodedGuess={currentPuzzle?.encoding.decodeText(guessBits) || ""}
          handleBitClick={this.handleBitClick}
        />
        <div className="encodingInputs">
          <p>
            <input type="button" className="bitInput" value="0" onClick={() => this.addBit("0")} />
            <input type="button" className="bitInput" value="1" onClick={() => this.addBit("1")} />
            <input type="button" className="bitInput" value="⌫" onClick={this.deleteBit} />
          </p>
          <p>
            <input type="button" value="Submit" onClick={this.handleSubmitClick} />
          </p>
        </div>
      </>
    );
  }
}

export default EncodePuzzle;
