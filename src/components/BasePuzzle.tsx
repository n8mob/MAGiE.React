import {Component} from "react";
import {Puzzle} from "../Menu.ts";
import BinaryJudge from "../judgment/BinaryJudge.ts";
import FullJudgment from "../judgment/FullJudgment.ts";
import {SequenceJudgment} from "../judgment/SequenceJudgment.ts";
import DisplayMatrix from "./DisplayMatrix.tsx";
import {DisplayRow} from "../encoding/BinaryEncoder.ts";

interface PuzzleProps {
  puzzle: Puzzle;
  displayWidth: number;
  onWin: () => void;
}

interface PuzzleState {
  currentPuzzle?: Puzzle;
  judge: BinaryJudge | null;
  guessText: string;
  guessBits: string;
  winBits: string;
  displayRows: DisplayRow[];
  judgment: FullJudgment<SequenceJudgment>;
  updating: boolean;
}

abstract class BasePuzzle<TProps extends PuzzleProps, TState extends PuzzleState> extends Component<TProps, TState> {
  protected constructor(props: TProps) {
    super(props);
    const initialState: PuzzleState = {
      currentPuzzle: props.puzzle,
      judge: null,
      guessText: "",
      guessBits: "",
      winBits: "",
      displayRows: [],
      judgment: new FullJudgment<SequenceJudgment>(false, "", []),
      updating: false,
    };

    this.state = initialState as TState;
    this.handleSubmitClick = this.handleSubmitClick.bind(this);
  }

  abstract updateJudge(puzzle: Puzzle): void;

  componentDidMount() {
    this.updateCurrentPuzzle(this.props.puzzle);
  }

  componentDidUpdate(prevProps: PuzzleProps, prevState: TState) {
    if (prevProps.puzzle !== this.props.puzzle) {
      this.updateCurrentPuzzle(this.props.puzzle);
    }

    if (
      prevState.currentPuzzle !== this.state.currentPuzzle ||
      prevState.guessText !== this.state.guessText ||
      prevState.guessBits !== this.state.guessBits ||
      prevState.winBits !== this.state.winBits ||
      prevState.judge !== this.state.judge
    ) {
      this.updateJudgment();
      this.updateDisplayRows();
    }
  }

  handleSubmitClick() {
    const {currentPuzzle, guessBits, winBits} = this.state;
    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return;
    }

    const split = (bits: string) => currentPuzzle.encoding.splitForDisplay(bits, this.props.displayWidth);
    const newJudgment = this.state.judge?.judgeBits(guessBits, winBits, split);
    if (newJudgment) {
      if (newJudgment.isCorrect && guessBits.length == winBits.length) {
        this.props?.onWin();
      } else {
        this.setState({judgment: newJudgment});
      }
    }
  }

  updateDisplayRows() {
    const {currentPuzzle, guessBits} = this.state;
    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return;
    }

    const displayRowSplit = currentPuzzle.encoding.splitForDisplay(guessBits, this.props.displayWidth);
    const newDisplayRows: DisplayRow[] = [];
    let displayRow = displayRowSplit.next();
    while (displayRow && !displayRow.done) {
      newDisplayRows.push(displayRow.value);
      displayRow = displayRowSplit.next();
    }

    this.setState({displayRows: newDisplayRows});
  }

  resetForNextPuzzle() {
    this.setState({
      guessText: "",
      guessBits: "",
      winBits: "",
      judgment: new FullJudgment<SequenceJudgment>(false, "", []),
    });
  }

  updateCurrentPuzzle(puzzle: Puzzle) {
    this.setState({
      currentPuzzle: puzzle,
      judge: null,
      guessBits: "",
      winBits: "",
      displayRows: [],
      judgment: new FullJudgment<SequenceJudgment>(false, "", []),
    });
    this.resetForNextPuzzle();

    if (puzzle) {
      this.updateJudge(puzzle);
      const newWinText = puzzle.encoding.encodeText(puzzle.winText);
      this.setState({ winBits: newWinText });
      this.updateJudgment();
    }
  }

  updateJudgment() {
    const { currentPuzzle, judge, winBits, guessBits } = this.state;
    if (currentPuzzle && judge) {
      const splitter = (bits: string) => currentPuzzle.encoding.splitForDisplay(bits || "", this.props.displayWidth);
      const judgment = judge.judgeBits(guessBits, winBits, splitter);
      if (judgment) {
        this.setState({ judgment });
      }
    }
  }

  render() {
    const { currentPuzzle, displayRows, guessBits, judgment} = this.state;

    return (
      <>
        <DisplayMatrix
          key={`${currentPuzzle}-${guessBits}-${judgment}-${displayRows.length}`}
          bits={guessBits}
          judgments={judgment.sequenceJudgments}
          handleBitClick={() => {}} // read-only bits, EncodePuzzle can add an update function.
        />
        <div className={"encodingInputs"}>
          <input type="button" value="Check Answer" onClick={this.handleSubmitClick}/>
        </div>
      </>
    );
  }
}

export default BasePuzzle;
export type { PuzzleProps, PuzzleState };
