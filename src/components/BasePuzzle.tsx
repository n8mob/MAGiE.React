import React, { Component, createRef } from "react";
import { Puzzle } from "../Menu.ts";
import BinaryJudge from "../judgment/BinaryJudge.ts";
import FullJudgment from "../judgment/FullJudgment.ts";
import { SequenceJudgment } from "../judgment/SequenceJudgment.ts";
import DisplayMatrix, { DisplayMatrixUpdate } from "./DisplayMatrix.tsx";
import { BitString, DisplayRow } from "../encoding/BinaryEncoder.ts";
import ReactGA4 from "react-ga4";
import VariableWidthEncoder from "../encoding/VariableWidthEncoder.ts";
import VariableWidthDecodingJudge from "../judgment/VariableWidthDecodingJudge.ts";
import FixedWidthEncoder from "../encoding/FixedWidthEncoder.ts";
import FixedWidthDecodingJudge from "../judgment/FixedWidthDecodingJudge.ts";

interface PuzzleProps {
  puzzle: Puzzle;
  onWin: () => void;
  hasWon: boolean;
  onShareWin: () => void;
  bitDisplayWidthPx: number;
}

interface PuzzleState {
  currentPuzzle?: Puzzle;
  judge: BinaryJudge | null;
  guessText: string;
  guessBits: BitString;
  winBits: BitString;
  displayRows: DisplayRow[];
  judgment: FullJudgment<SequenceJudgment>;
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

abstract class BasePuzzle<TProps extends PuzzleProps, TState extends PuzzleState> extends Component<TProps, TState> {
  displayMatrixRef: React.RefObject<DisplayMatrixUpdate>;
  isFirstVisit = !localStorage.getItem('seenBefore');

  protected constructor(props: TProps) {
    super(props);
    const initialState: PuzzleState = {
      currentPuzzle: props.puzzle,
      judge: null,
      guessText: "",
      guessBits: [],
      winBits: [],
      displayRows: [],
      judgment: new FullJudgment<SequenceJudgment>(false, "", []),
      updating: false,
      bitDisplayWidthPx: props.bitDisplayWidthPx,
      displayAreaWidthPx: props.displayAreaWidthPx,
      displayWidth: 0
    };

    this.displayMatrixRef = createRef<DisplayMatrixUpdate>();

    this.state = initialState as TState;
    this.handleSubmitClick = this.handleSubmitClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  abstract handleKeyDown(event: KeyboardEvent): void;

  updateDisplayWidth = () => {
    if (this.displayMatrixRef.current) {
      const displayMatrixWidth = this.displayMatrixRef.current.getWidth();
      const newDisplayWidth = displayMatrixWidth / this.state.bitDisplayWidthPx;
      this.setState({displayWidth: newDisplayWidth});
    } else {
      console.warn("DisplayMatrix ref is not ready yet.");
    }
  };

  componentDidMount() {
    if (this.isFirstVisit) {
      localStorage.setItem('seenBefore', 'true');
    }
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
      this.updateDisplayRows();
    }
  }

  handleSubmitClick() {
    const {currentPuzzle, guessBits, winBits, displayRows} = this.state;
    if (!currentPuzzle) {
      ReactGA4.event({
        category: 'Error',
        action: 'Missing puzzle',
      })
      return;
    }

    const split: (bits: string) => Generator<DisplayRow, void> = (bits: string) => {
      return currentPuzzle.encoding.splitForDisplay(bits, this.state.displayWidth);
    };

    const newJudgment = this.state.judge?.judgeBits(guessBits, winBits, split);
    if (newJudgment) {
      ReactGA4.event(
        "GuessSubmitted",
        {
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
        this.setState({
          displayRows: displayRows.concat(new DisplayRow([], "new win text!")),
        });
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

    const displayRowSplit = currentPuzzle.encoding.splitForDisplay(guessBits, this.state.displayWidth);
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
      guessBits: [],
      winBits: [],
      judgment: new FullJudgment<SequenceJudgment>(false, "", []),
    });
  }

  updateCurrentPuzzle(puzzle: Puzzle) {
    this.setState({
      currentPuzzle: puzzle,
      judge: null,
      guessBits: [],
      winBits: [],
      displayRows: [],
      judgment: new FullJudgment<SequenceJudgment>(false, "", []),
    });
    this.resetForNextPuzzle();

    if (puzzle) {
      this.updateJudge(puzzle);
      const newWinText = puzzle.encoding.encodeText(puzzle.winText);
      this.setState({winBits: newWinText});
      this.updateJudgment();
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

  updateJudgment() {
    const {currentPuzzle, judge, guessBits, winBits} = this.state;
    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return;
    }

    const splitter: (bits: BitString) => Generator<DisplayRow, void> = (bits: BitString) => {
      return currentPuzzle.encoding.splitForDisplay(bits, this.state.displayWidth);
    };
    const newJudgment = judge?.judgeBits(guessBits, winBits, splitter);
    if (newJudgment) {
      this.setState({judgment: newJudgment});
      this.displayMatrixRef.current?.updateJudgment(newJudgment.sequenceJudgments);

      let eventParams = {
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
        ReactGA4.event("win", {...eventParams, solve_time_ms: -1});
        this.props.onWin();
      } else {
        ReactGA4.event("guess", eventParams);
      }
    }
  }

  render() {
    const {currentPuzzle, displayRows, guessBits, judgment} = this.state;

    return (
      <>
        <DisplayMatrix
          key={`${currentPuzzle}-${guessBits}-${judgment}-${displayRows.length}`}
          bits={guessBits}
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

export default BasePuzzle;
export type { PuzzleProps, PuzzleState };
