import {createRef} from "react";
import {PuzzleProps, PuzzleState} from "./BasePuzzle.tsx";
import DisplayMatrix, {DisplayMatrixUpdate} from "./DisplayMatrix";
import BasePuzzle from "./BasePuzzle";
import {Puzzle} from "../Menu.ts";
import VariableWidthEncoder from "../encoding/VariableWidthEncoder.ts";
import VariableWidthEncodingJudge from "../judgment/VariableWidthEncodingJudge.ts";
import FixedWidthEncoder from "../encoding/FixedWidthEncoder.ts";
import FixedWidthEncodingJudge from "../judgment/FixedWidthEncodingJudge.ts";
import FullJudgment from "../judgment/FullJudgment.ts";
import {SequenceJudgment} from "../judgment/SequenceJudgment.ts";

class EncodePuzzle extends BasePuzzle<PuzzleProps, PuzzleState> {
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

    this.displayMatrixRef = createRef<DisplayMatrixUpdate>();

    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();
    window.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    super.componentWillUnmount?.();
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "1":
      case "0":
        this.setState(
          (prevState) => ({
            guessBits: prevState.guessBits + event.key, // Update bits directly
          }),
          () => {
            this.updateJudgment(); // Check win condition after updating bits
          }
        );
        break;

      case "Delete":
      case "Backspace":
        this.setState(
          (prevState) => ({
            guessBits: prevState.guessBits.slice(0, -1), // Remove the last bit
          }),
          () => {
            this.updateJudgment(); // Recheck win condition
          }
        );
        break;

      default:
        event.preventDefault(); // Block all other keys
        break;
    }
  }

  handleGuessUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newGuessBits = event.target.value.replace(/[^01]/g, ""); // Ensure only binary input
    const newState = {
      guessBits: newGuessBits,
      guessText: this.state.currentPuzzle?.encoding.decodeText(newGuessBits) || "",
    };
    this.setState(newState);
  };

  updateJudge(puzzle: Puzzle) {
    if (puzzle.encoding instanceof VariableWidthEncoder) {
      this.setState({judge: new VariableWidthEncodingJudge(puzzle.encoding)});
    } else if (puzzle.encoding instanceof FixedWidthEncoder) {
      this.setState({judge: new FixedWidthEncodingJudge(puzzle.encoding)});
    } else {
      console.error(`Unsupported encoding type: ${puzzle.encoding.getType()}, ${puzzle.encoding_name}`);
    }
  }

  updateDisplayRows() {
    const {currentPuzzle, guessBits} = this.state;
    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return;
    }

    const displayRowSplit = currentPuzzle.encoding.splitForDisplay(guessBits, this.props.displayWidth);
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

    const splitter = (bits: string) => currentPuzzle.encoding.splitForDisplay(bits, this.props.displayWidth);
    const newJudgment = judge?.judgeBits(guessBits, winBits, splitter);
    if (newJudgment) {
      this.setState({judgment: newJudgment});
      this.displayMatrixRef.current?.updateJudgment(newJudgment.sequenceJudgments);
      if (newJudgment.isCorrect) {
        this.props.onWin();
      }
    }
  }

  render() {
    const {currentPuzzle, judgment, guessText, winBits} = this.state;

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
            bits={winBits}
            judgments={judgment.sequenceJudgments}
            handleBitClick={() => {
            }}  // bits will be read-only for the encode puzzle
          />
          {judgment.isCorrect && [...currentPuzzle.winMessage].map((winLine, winIndex) => <p
            key={`win-text-${winIndex}`}>{winLine}</p>)}
        </div>
        <div className="puzzle-inputs">
          <input type="text" className="encode-input" value={guessText} onChange={this.handleGuessUpdate}/>
          <input type="button" value="Submit" onClick={this.handleSubmitClick}/>
        </div>
      </>
    );
  }
}

export default EncodePuzzle;

