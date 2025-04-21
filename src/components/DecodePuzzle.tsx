import {createRef} from "react";
import {PuzzleProps, PuzzleState} from "./BasePuzzle.tsx";
import DisplayMatrix, {DisplayMatrixUpdate} from "./DisplayMatrix";
import BasePuzzle from "./BasePuzzle";
import FullJudgment from "../judgment/FullJudgment.ts";
import {SequenceJudgment} from "../judgment/SequenceJudgment.ts";
import {Puzzle} from "../Menu.ts";
import VariableWidthEncoder from "../encoding/VariableWidthEncoder.ts";
import VariableWidthDecodingJudge from "../judgment/VariableWidthDecodingJudge.ts";
import FixedWidthEncoder from "../encoding/FixedWidthEncoder.ts";
import FixedWidthDecodingJudge from "../judgment/FixedWidthDecodingJudge.ts";
import ReactGA4 from "react-ga4";
import {Link} from "react-router-dom";

class DecodePuzzle extends BasePuzzle<PuzzleProps, PuzzleState> {
  private isFirstVisit = !localStorage.getItem('seenBefore');

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
    if (this.isFirstVisit) {
      localStorage.setItem('seenBefore', 'true');
    }
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

  handleGuessUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newGuessText = event.target.value.toUpperCase();
    const newState = {
      guessText: newGuessText,
      guessBits: this.state.currentPuzzle?.encoding.encodeText(newGuessText) || "",
    };
    this.setState(newState);
  };

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

  render() {
    const {currentPuzzle, judgment, guessText, winBits} = this.state;
    const {hasWon} = this.props;

    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return <></>;
    }

    return (
      <>
        <div id="main-display" className="display">
          {[...currentPuzzle.clue].map((clueLine, clueIndex) => <p key={clueIndex}>{clueLine}</p>)}
          <DisplayMatrix
            ref={this.displayMatrixRef}
            bits={winBits}
            judgments={judgment.sequenceJudgments}
            handleBitClick={() => {
            }}  // bits will be read-only for the decode puzzle
          />
          <div id="win-message">
            {hasWon && <p>{guessText}</p>}
            {hasWon && <p>...</p>}
            {judgment.isCorrect && [...currentPuzzle.winMessage].map((winLine, winIndex) => <p
              key={`win-message-${winIndex}`}>{winLine}</p>)}
          </div>
        </div>
        {hasWon ? (
          <>
            <div className="share-controls">
              <button onClick={this.props.onShareWin}>Share Your Win</button>
            </div>
            <div className="post-win-links">
              <p>
                <Link
                  to={"/test/2025/04/04"}
                  onClick={() => {
                    ReactGA4.event('story_start_clicked', {
                      source: 'post-win-link',
                      puzzle_slug: currentPuzzle.slug,
                      is_first_visit: this.isFirstVisit,
                    });
                  }}
                >
                  |&lt;&lt; Back to the beginning
                </Link>
              </p>
            </div>
          </>
        ) : (
          <div className="puzzle-inputs">
            <input type="text" className="decode-input" value={guessText} onChange={this.handleGuessUpdate}/>
            <button onClick={this.handleSubmitClick}>Check Answer</button>
          </div>
        )}
      </>
    )
      ;
  }
}

export default DecodePuzzle;

