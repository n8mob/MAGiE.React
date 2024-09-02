import React, {createRef} from "react";
import BasePuzzle, {PuzzleProps, PuzzleState} from "./BasePuzzle.tsx";
import DisplayMatrix, {DisplayMatrixUpdate} from "./DisplayMatrix.tsx";
import FullJudgment from "../judgment/FullJudgment.ts";
import {SequenceJudgment} from "../judgment/SequenceJudgment.ts";
import VariableWidthEncoder from "../encoding/VariableWidthEncoder.ts";
import VariableWidthDecodingJudge from "../judgment/VariableWidthDecodingJudge.ts";
import FixedWidthEncoder from "../encoding/FixedWidthEncoder.ts";
import FixedWidthDecodingJudge from "../judgment/FixedWidthDecodingJudge.ts";
import {Puzzle} from "../Menu.ts";

const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

class DecodePuzzle extends BasePuzzle<PuzzleProps, PuzzleState> {
  displayMatrixRef: React.RefObject<DisplayMatrixUpdate>;

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

    preloadImages([
      'assets/Bit_off_Yellow.png',
      'assets/Bit_on_Yellow.png',
      'assets/Bit_off_Teal.png',
      'assets/Bit_on_Teal.png',
      'assets/Bit_off_Purple.png',
      'assets/Bit_on_Purple.png',
    ]);
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
      case "Enter":
        this.handleSubmitClick();
        break;
      default:
        break;
    }
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

  updateDisplayRows() {
    const {currentPuzzle, winBits} = this.state;
    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return;
    }

    const displayRowSplit = currentPuzzle.encoding.splitForDisplay(winBits, this.props.displayWidth);
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

  render() {
    const {currentPuzzle, judgment, guessText, winBits} = this.state;

    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return <></>;
    }

    return (
      <>
        <div id="bit-field" className="clue-and-bits">
          {[...currentPuzzle.clue].map((clueLine, clueIndex) => <p key={clueIndex}>{clueLine}</p>)}
          <DisplayMatrix
            ref={this.displayMatrixRef}
            bits={winBits}
            judgments={judgment.sequenceJudgments}
            handleBitClick={() => {
            }}  // bits will be read-only for the decode puzzle
          />
          {judgment.isCorrect && [...currentPuzzle.winMessage].map((winLine, winIndex) => <p key={`win-text-${winIndex}`}>{winLine}</p>)}
        </div>
        <div className="puzzle-inputs">
          <input type="text" className="decode-input" value={guessText} onChange={this.handleGuessUpdate}/>
          <input type="button" value="Submit" onClick={this.handleSubmitClick}/>
        </div>
      </>
    )
      ;
  }
}

export default DecodePuzzle;
