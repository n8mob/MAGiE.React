import { Component, createRef, RefObject } from "react";
import { Puzzle } from "../Menu.ts";
import { BinaryJudge, BitJudge, NewSequenceJudgment } from "../judgment/BinaryJudge.ts";
import { FullJudgment } from "../judgment/FullJudgment.ts";
import { DisplayMatrix, DisplayMatrixUpdate } from "./DisplayMatrix.tsx";
import ReactGA4 from "react-ga4";
import { VariableWidthEncoder } from "../encoding/VariableWidthEncoder.ts";
import { VariableWidthDecodingJudge } from "../judgment/VariableWidthDecodingJudge.ts";
import { FixedWidthEncoder } from "../encoding/FixedWidthEncoder.ts";
import { FixedWidthDecodingJudge } from "../judgment/FixedWidthDecodingJudge.ts";
import { DisplayRow } from "../encoding/DisplayRow.ts";
import { BitSequence } from "../BitSequence.ts";
import { VariableWidthEncodingJudge } from "../judgment/VariableWidthEncodingJudge.ts";
import { FixedWidthEncodingJudge } from "../judgment/FixedWidthEncodingJudge.ts";

interface PuzzleProps {
  puzzle: Puzzle;
  onWin: () => void;
  hasWon: boolean;
  onShareWin: () => void;
  bitDisplayWidthPx: number;
  bitJudge?: BitJudge;
  newSequenceJudgment?: NewSequenceJudgment
}

interface PuzzleState {
  currentPuzzle?: Puzzle;
  judge?: BinaryJudge;
  guessText: string;
  guessBits: BitSequence;
  winBits: BitSequence;
  displayRows: DisplayRow[];
  judgment: FullJudgment;
  bitJudge?: BitJudge;
  newSequenceJudgment?: NewSequenceJudgment;
  updating: boolean;
  bitDisplayWidthPx: number;
  displayWidth: number;
}

const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

abstract class BasePuzzle<TProps extends PuzzleProps = PuzzleProps, TState extends PuzzleState = PuzzleState>
  extends Component<TProps, TState> {
  displayMatrixRef: RefObject<DisplayMatrixUpdate>;
  isFirstVisit = !localStorage.getItem('isFirstVisit');

  protected constructor(props: TProps) {
    super(props);
    const initialState = this.emptyState(props);

    this.displayMatrixRef = createRef<DisplayMatrixUpdate>();

    this.state = initialState as TState;
    this.handleSubmitClick = this.handleSubmitClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  protected emptyState(props: TProps): PuzzleState {
    return {
      currentPuzzle: props.puzzle,
      guessText: '',
      guessBits: BitSequence.empty(),
      winBits: props.puzzle
               ? props.puzzle.encoding.encodeText(props.puzzle.winText)
               : BitSequence.fromString(""),
      displayRows: [],
      judgment: new FullJudgment(false, BitSequence.empty(), []),
      updating: false,
      bitDisplayWidthPx: props.bitDisplayWidthPx,
      displayWidth: 0
    } as PuzzleState;
  }

  abstract handleKeyDown(event: KeyboardEvent): void;

  updateDisplayWidth = () => {
    if (this.displayMatrixRef.current) {
      const displayMatrixWidth = this.displayMatrixRef.current.getWidth();
      const newDisplayWidth = Math.floor(displayMatrixWidth / this.state.bitDisplayWidthPx);
      this.setState({displayWidth: newDisplayWidth}, () => {
        this.updateJudgment();
      });
    } else {
      console.warn("DisplayMatrix ref is not ready yet.");
    }
  };

  componentDidMount() {
    this.updateCurrentPuzzle(this.props.puzzle);

    preloadImages([
      'assets/Bit_off_Yellow.png',
      'assets/Bit_on_Yellow.png',
      'assets/Bit_off_Teal.png',
      'assets/Bit_on_Teal.png',
      'assets/Bit_off_Purple.png',
      'assets/Bit_on_Purple.png',
    ]);

    this.updateDisplayWidth();
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("resize", this.updateDisplayWidth);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDisplayWidth);
    window.removeEventListener("keydown", this.handleKeyDown);
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
    }
  }

  handleSubmitClick() {
    const {currentPuzzle, guessBits, winBits, displayRows, bitJudge, newSequenceJudgment} = this.state;
    if (!currentPuzzle) {
      ReactGA4.event('state_error', {detail: 'missing_puzzle'});
      return;
    }

    const split = (bits: BitSequence) => {
      return currentPuzzle.encoding.splitForDisplay(bits, this.state.displayWidth);
    };

    if (!this.state.judge) {
      console.error(`Missing judge object for encoding: ${currentPuzzle.encoding_name}`);
      return;
    }

    const newJudgment = this.state.judge.judgeBits(guessBits, winBits, split, bitJudge, newSequenceJudgment);
    if (newJudgment) {
      ReactGA4.event('guess_submitted', {
          puzzle_slug: currentPuzzle.slug,
          guessBits: guessBits.toString(),
          clue: currentPuzzle.clue,
          encoding: currentPuzzle.encoding_name,
          type: currentPuzzle.type,
          winText: currentPuzzle.winText,
          judgment_is_correct: newJudgment.isCorrect,
          judgment_correct_guess: newJudgment.correctGuess.toString(),
          pagePath: window.location.pathname + window.location.search
        }
      );

      if (newJudgment.isCorrect && guessBits.length == winBits.length) {
        this.props?.onWin();
        const newDisplayRows: DisplayRow[] = displayRows.slice()
        this.setState({displayRows: newDisplayRows});
      } else {
        this.setState({judgment: newJudgment});
      }
    }
  }

  abstract splitForDisplay(displayWidth: number): Generator<DisplayRow, void>;

  updateDisplayRows() {
    const {currentPuzzle} = this.state;
    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return;
    }

    const newDisplayRows: DisplayRow[] = [...this.splitForDisplay(this.state.displayWidth)];
    this.setState({displayRows: newDisplayRows});
  }

  updateCurrentPuzzle(puzzle: Puzzle) {
    this.setState(
      {
        currentPuzzle: puzzle,
        displayRows: [],
        guessText: puzzle.init || '',
        judgment: new FullJudgment(false, BitSequence.empty(), []),
      }, () => {
        this.updateJudge(puzzle, () => {
          const newWinBits = puzzle.encoding.encodeText(puzzle.winText);
          this.setState({winBits: newWinBits});
          this.updateJudgment();
        });
      });
  }

  protected updateJudge(puzzle: Puzzle, callback?: () => void) {
    if (!puzzle.encoding) {
      console.error(`Missing encoding for puzzle ${puzzle.slug}`);
      return;
    }

    if (puzzle.encoding instanceof VariableWidthEncoder) {
      if (puzzle.type === "Encode") {
        this.setState({judge: new VariableWidthEncodingJudge(puzzle.encoding)}, callback);
      } else {
        this.setState({judge: new VariableWidthDecodingJudge(puzzle.encoding)}, callback);
      }
    } else if (puzzle.encoding instanceof FixedWidthEncoder) {
      if (puzzle.type === "Encode") {
        this.setState({judge: new FixedWidthEncodingJudge(puzzle.encoding)}, callback);
      } else if (puzzle.type === "Decode") {
        this.setState({judge: new FixedWidthDecodingJudge(puzzle.encoding)}, callback);
      }
    } else {
      console.error("Unsupported encoding type");
      if (callback) {
        callback();
      }
    }
  }


  updateJudgment() {
    const {currentPuzzle, judge, guessBits, winBits, bitJudge, newSequenceJudgment} = this.state;
    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return;
    }

    const splitter = (bits: BitSequence) => currentPuzzle.encoding.splitForDisplay(bits, this.state.displayWidth);
    const newJudgment = judge?.judgeBits(guessBits, winBits, splitter, bitJudge, newSequenceJudgment);
    if (newJudgment && !newJudgment.equals(this.state.judgment)) {
      this.setState({judgment: newJudgment});
      this.displayMatrixRef.current?.updateJudgment(newJudgment.sequenceJudgments);

      const eventParams = {
        puzzle_slug: currentPuzzle.slug,
        guess_bits: guessBits,
        guess_text: this.state.guessText,
        winText: currentPuzzle.winText,
        encoding: currentPuzzle.encoding_name,
        encoding_type: currentPuzzle.encoding.getType(),
        judgment_is_correct: newJudgment.isCorrect,
        pagePath: window.location.pathname + window.location.search,
      };

      if (newJudgment.isCorrect) {
        ReactGA4.event("winning_judgment", eventParams);
        this.props.onWin();
      } else {
        ReactGA4.event("guess", eventParams);
      }
    }
    this.updateDisplayRows();
  }

  render() {
    const {currentPuzzle, displayRows, guessBits, judgment} = this.state;

    return (
      <>
        <DisplayMatrix
          key={`${currentPuzzle}-${guessBits}-${judgment}-${displayRows.length}`}
          displayRows={displayRows}
          judgments={judgment.sequenceJudgments}
          handleBitClick={() => {
          }} // read-only bits, EncodePuzzle can add an update function.
        />
        <div className={"encodingInputs"}>
          <input type="button" value="Check Answer" onClick={this.handleSubmitClick}/>
        </div>
      </>
    );
  }
}

export { BasePuzzle };
export type { PuzzleProps, PuzzleState };
