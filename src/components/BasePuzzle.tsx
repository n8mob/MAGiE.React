import { Component } from "react";
import { Puzzle } from "../Menu.ts";
import BinaryJudge from "../BinaryJudge.ts";
import FullJudgment from "../FullJudgment.ts";
import { SequenceJudgment } from "../SequenceJudgment.ts";
import DisplayMatrix from "./DisplayMatrix.tsx";

interface PuzzleProps {
  puzzle: Puzzle;
  displayWidth: number;
  onWin: () => void;
}

interface PuzzleState {
  currentPuzzle?: Puzzle;
  judge: BinaryJudge | null;
  guessBits: string;
  winBits: string;
  judgment: FullJudgment<SequenceJudgment>;
  guessText: string;
  updating: boolean;
}

class BasePuzzle extends Component<PuzzleProps, PuzzleState> {
  constructor(props: PuzzleProps) {
    super(props);
    this.state = {
      currentPuzzle: props.puzzle,
      judge: null,
      guessBits: "",
      winBits: "",
      judgment: new FullJudgment<SequenceJudgment>(false, "", []),
      guessText: "",
      updating: false,
    };
  }

  componentDidMount() {
    this.updateCurrentPuzzle(this.props.puzzle);
  }

  componentDidUpdate(prevProps: PuzzleProps, prevState: PuzzleState) {
    if (prevProps.puzzle !== this.props.puzzle) {
      this.updateCurrentPuzzle(this.props.puzzle);
    }

    if (prevState.guessText !== this.state.guessText && !this.state.updating) {
      this.updateGuessBits();
    }

    if (prevState.guessBits !== this.state.guessBits && !this.state.updating) {
      this.updateGuessText();
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

  updateCurrentPuzzle(puzzle: Puzzle) {
    this.setState({
      currentPuzzle: puzzle,
      guessBits: "",
      winBits: "",
      judgment: new FullJudgment<SequenceJudgment>(false, "", []),
    });

    if (puzzle) {
      const newWinText = puzzle.encoding.encodeText(puzzle.winText);
      this.setState({ winBits: newWinText });
    }
  }

  updateGuessBits() {
    const { currentPuzzle, guessText } = this.state;
    if (currentPuzzle) {
      this.setState({ updating: true });
      const newGuessBits = currentPuzzle.encoding.encodeText(guessText);
      this.setState({ guessBits: newGuessBits, updating: false });
    }
  }

  updateGuessText() {
    const { currentPuzzle, guessBits } = this.state;
    if (currentPuzzle) {
      this.setState({ updating: true });
      const newGuessText = currentPuzzle.encoding.decodeText(guessBits);
      this.setState({ guessText: newGuessText, updating: false });
    }
  }

  updateJudgment() {
    const { currentPuzzle, judge, winBits, guessBits } = this.state;
    if (currentPuzzle && judge && winBits && guessBits) {
      const judgment = judge.judgeBits(guessBits, winBits, this.props.displayWidth);
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
          guessBits={guessBits}
          judgments={judgment.sequenceJudgments}
          decodedGuess={guessText}
          handleBitClick={() => {}} // read-only bits, EncodePuzzle can add an update function.
        />
      </>
    );
  }
}

export default BasePuzzle;
export type { PuzzleProps };
