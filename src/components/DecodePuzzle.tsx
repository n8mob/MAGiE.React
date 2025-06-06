import { BasePuzzle, PuzzleProps, PuzzleState } from "./BasePuzzle.tsx";
import { DisplayMatrix } from "./DisplayMatrix";
import { BitSequence } from "../BitSequence.ts";
import ReactGA4 from "react-ga4";
import { Link } from "react-router-dom";
import { ChangeEvent, createRef, RefObject } from "react";
import { DisplayRow } from "../encoding/DisplayRow.ts";

class DecodePuzzle extends BasePuzzle {
  gameContentRef: RefObject<HTMLDivElement>;
  mainDisplayRef: RefObject<HTMLDivElement>;
  clueRef: RefObject<HTMLDivElement>;
  winMessageRef: RefObject<HTMLDivElement>; // Add ref for win-message
  puzzleInputsRef: RefObject<HTMLDivElement>; // Ref for #puzzle-inputs
  resizeTimeout: number | null = null;
  waitingForResize: boolean = false;

  constructor(props: PuzzleProps) {
    super(props);
    this.gameContentRef = createRef<HTMLDivElement>();
    this.mainDisplayRef = createRef<HTMLDivElement>();
    this.clueRef = createRef<HTMLDivElement>();
    this.winMessageRef = createRef<HTMLDivElement>(); // Initialize ref
    this.puzzleInputsRef = createRef<HTMLDivElement>();
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

  handleGuessUpdate = (event: ChangeEvent<HTMLInputElement>) => {
    const newGuessText = event.target.value.toUpperCase();
    const newState = {
      guessText: newGuessText,
      guessBits: this.state.currentPuzzle?.encoding.encodeText(newGuessText) || BitSequence.empty(),
    } as PuzzleState;
    this.setState(newState);
  };


  * splitForDisplay(displayWidth: number): Generator<DisplayRow, void> {
    if (!this.state.currentPuzzle) {
      return;
    }

    const allBits = this.state.winBits.appendBits(this.state.guessBits.slice(this.state.winBits.length));

    yield* this.state.currentPuzzle.encoding.splitForDisplay(allBits, displayWidth);
  }

  componentDidUpdate(prevProps: PuzzleProps, prevState: PuzzleState) {
    super.componentDidUpdate(prevProps, prevState);
    if (!prevProps.hasWon && this.props.hasWon) {
      // Only scroll when hasWon changes to true
      const mainDisplay = this.mainDisplayRef.current;
      const winMessage = this.winMessageRef.current;
      if (mainDisplay && winMessage) {
        // Scroll so the bottom of win-message is visible, but not past the bottom
        const mainRect = mainDisplay.getBoundingClientRect();
        const winRect = winMessage.getBoundingClientRect();
        // If win-message is below the visible area, scroll it into view
        if (winRect.bottom > mainRect.bottom || winRect.top < mainRect.top) {
          // Scroll so the bottom of win-message aligns with the bottom of main-display
          const scrollOffset = winMessage.offsetTop + winMessage.offsetHeight - mainDisplay.clientHeight;
          mainDisplay.scrollTop = scrollOffset > 0 ? scrollOffset : 0;
        }
      }
    }
  }

  handleInputFocus = () => {
    this.waitingForResize = true;
    window.addEventListener('resize', this.handleResizeDebounced);
    // Do not call adjustMainDisplayHeightForInput or scrollMainDisplayForInput immediately
    // Only do so after resize debounce
  };

  handleInputBlur = () => {
    // Reset main-display max-height when input loses focus
    const mainDisplay = this.mainDisplayRef.current;
    if (mainDisplay) {
      mainDisplay.style.maxHeight = '';
    }
  };

  handleResizeDebounced = () => {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = window.setTimeout(() => {
      if (this.waitingForResize) {
        this.adjustMainDisplayHeightForInput();
        // Add a small delay to ensure layout is stable before scrolling
        setTimeout(() => {
          this.scrollMainDisplayForInput();
        }, 50);
        window.removeEventListener('resize', this.handleResizeDebounced);
        this.waitingForResize = false;
      }
    }, 200);
  };

  adjustMainDisplayHeightForInput = () => {
    const mainDisplay = this.mainDisplayRef.current;
    const puzzleInputs = this.puzzleInputsRef.current;
    if (mainDisplay && puzzleInputs) {
      const inputsRect = puzzleInputs.getBoundingClientRect();
      // Calculate available height: window.innerHeight - height of puzzleInputs
      const availableHeight = window.innerHeight - inputsRect.height;
      mainDisplay.style.maxHeight = availableHeight + 'px';
    }
  };

  componentDidMount() {
    super.componentDidMount();
    // Attach focus handler to input after mount
    setTimeout(() => {
      const input = this.puzzleInputsRef.current?.querySelector('input');
      if (input) {
        input.addEventListener('focus', this.handleInputFocus, { passive: true });
        input.addEventListener('blur', this.handleInputBlur, { passive: true });
      }
    }, 0);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    const input = this.puzzleInputsRef.current?.querySelector('input');
    if (input) {
      input.removeEventListener('focus', this.handleInputFocus);
      input.removeEventListener('blur', this.handleInputBlur);
    }
    window.removeEventListener('resize', this.handleResizeDebounced);
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

  scrollMainDisplayForInput = () => {
    const mainDisplay = this.mainDisplayRef.current;
    const puzzleInputs = this.puzzleInputsRef.current;
    if (mainDisplay && puzzleInputs) {
      // Scroll so main-display's top is at the top of the viewport, and puzzle-inputs is visible
      const mainRect = mainDisplay.getBoundingClientRect();
      const inputsRect = puzzleInputs.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      // If main-display is not at the top, scroll so it is
      if (mainRect.top < 0 || mainRect.top > 0) {
        console.log(`scrolling main-display to top: ${scrollY + mainRect.top}`);
        window.scrollTo({ top: scrollY + mainRect.top, behavior: 'smooth' });
      }
      // Optionally, ensure puzzle-inputs is visible (should be if main-display is at top)
      console.log(`puzzle-inputs rect top: ${inputsRect.top} bottom: ${inputsRect.bottom} window height: ${window.innerHeight}`);
      if (inputsRect.top < 0 || inputsRect.bottom > window.innerHeight) {
        console.log(`scrolling to puzzle-inputs: ${scrollY + inputsRect.top}`);
        window.scrollTo({ top: scrollY + inputsRect.top, behavior: 'smooth' });
      }
    }
  };

  render() {
    const {currentPuzzle, judgment, guessText, displayRows} = this.state;
    const {hasWon} = this.props;

    if (!currentPuzzle) {
      console.error('Missing puzzle');
      return <></>;
    }

    return (
      <>
        <div id="game-content" ref={this.gameContentRef}>
          <div id="main-display" className="display" ref={this.mainDisplayRef}>
            <div id="clue-text" ref={this.clueRef}>
              {[...currentPuzzle.clue].map((clueLine, clueIndex) => <p key={clueIndex}>{clueLine}</p>)}
            </div>
            <DisplayMatrix
              ref={this.displayMatrixRef}
              displayRows={displayRows}
              judgments={judgment.sequenceJudgments}
              handleBitClick={() => {
              }} // Bits remain read-only
            />
            <div id="win-message" ref={this.winMessageRef}>
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
                    to={"/date/2025/04/04"}
                    onClick={() => {
                      ReactGA4.event('story_start_clicked', {
                        source: 'post-win-link',
                        puzzle_slug: currentPuzzle?.slug,
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
            <div id="puzzle-inputs" ref={this.puzzleInputsRef}>
              <input type="text"
                     inputMode="text"
                     className="decode-input"
                     placeholder={'DECODE TEXT HERE'}
                     autoComplete="off"
                     autoCorrect="off"
                     spellCheck="false"
                     value={guessText}
                     onChange={this.handleGuessUpdate}
                     enterKeyHint={"done"}/>
            </div>
          )}
        </div>
      </>);
  }
}

export { DecodePuzzle };
