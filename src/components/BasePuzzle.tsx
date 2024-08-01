import {Component} from "react";
import {Puzzle} from "../Menu.ts";
import BinaryJudge from "../judgment/BinaryJudge.ts";
import FullJudgment from "../judgment/FullJudgment.ts";
import {SequenceJudgment} from "../judgment/SequenceJudgment.ts";
import DisplayMatrix from "./DisplayMatrix.tsx";

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
  judgment: FullJudgment<SequenceJudgment>;
  updating: boolean;
}

abstract class BasePuzzle<TProps extends PuzzleProps, TState extends PuzzleState> extends Component<TProps, TState> {
  protected constructor(props: TProps) {
    super(props);

    this.state = {
      currentPuzzle: props.puzzle,
      judge: null,
      guessBits: "",
      guessText: "",
      winBits: "",
      judgment: new FullJudgment<SequenceJudgment>(false, "", []),
      updating: false,
    } as TState;
  }

  componentDidMount() {
    this.updateCurrentPuzzle(this.props.puzzle);
  }

  componentDidUpdate(prevProps: PuzzleProps, prevState: TState) {
    if (prevProps.puzzle !== this.props.puzzle) {
      this.updateCurrentPuzzle(this.props.puzzle);
    }

    if (
      prevState.currentPuzzle !== this.state.currentPuzzle ||
      prevState.guessBits !== this.state.guessBits ||
      prevState.winBits !== this.state.winBits ||
      prevState.judge !== this.state.judge
    ) {
      this.updateJudgment();
    }
  }

  abstract updateJudge(puzzle: Puzzle): void;

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
      judgment: new FullJudgment<SequenceJudgment>(false, "", []),
    });

    if (puzzle) {
      this.updateJudge(puzzle);
      const newWinText = puzzle.encoding.encodeText(puzzle.winText);
      this.setState({ winBits: newWinText });
    }
  }

  updateJudgment() {
    const { currentPuzzle, judge, winBits, guessBits } = this.state;
    if (currentPuzzle && judge && winBits && guessBits) {
      const splitter = (bits: string) => currentPuzzle.encoding.splitForDisplay(bits, this.props.displayWidth);
      const judgment = judge.judgeBits(guessBits, winBits, splitter);
      if (judgment) {
        this.setState({ judgment });
      }
    }
  }

  render() {
    const { currentPuzzle, guessBits, judgment, guessText } = this.state;

    return (
      <>
        <DisplayMatrix
          key={`${currentPuzzle}-${guessBits}-${judgment}`}
          bits={guessBits}
          judgments={judgment.sequenceJudgments}
          decodedGuess={guessText}
          handleBitClick={() => {}} // read-only bits, EncodePuzzle can add an update function.
        />
      </>
    );
  }
}

export default BasePuzzle;
export type { PuzzleProps, PuzzleState };
