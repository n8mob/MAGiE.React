import { BasePuzzle, PuzzleProps, PuzzleState } from "./BasePuzzle.tsx";
import { DisplayMatrix } from "./DisplayMatrix";
import { BitSequence } from "../BitSequence.ts";
import ReactGA4 from "react-ga4";
import { Link } from "react-router-dom";
import { ChangeEvent, createRef, RefObject } from "react";
import { DisplayRow } from "../encoding/DisplayRow.ts";

// Utility to match the mobile media query
function isMobileScreen() {
  return window.matchMedia('(max-height: 700px)').matches;
}

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
    const prevGuessBits = this.state.guessBits;
    const newGuessText = event.target.value.toUpperCase();
    const newGuessBits = this.state.currentPuzzle?.encoding.encodeText(newGuessText) || BitSequence.empty();
    const newState = {
      guessText: newGuessText,
      guessBits: newGuessBits,
    } as PuzzleState;
    this.setState(newState, () => {
      // Find last changed bit index
      let lastChangedIndex = -1;
      const minLen = Math.min(prevGuessBits.length, newGuessBits.length);
      for (let i = 0; i < minLen; ++i) {
        if (prevGuessBits.getBit(i) !== newGuessBits.getBit(i)) {
          lastChangedIndex = i;
        }
      }
      if (newGuessBits.length > prevGuessBits.length) {
        lastChangedIndex = newGuessBits.length - 1;
      }
      // Find which row contains this bit
      let rowIndex = -1;
      if (lastChangedIndex !== -1 && this.state.displayRows) {
        for (let i = 0; i < this.state.displayRows.length; ++i) {
          const row: DisplayRow = this.state.displayRows[i];
          if (row.length > 0) {
            const firstBitIndex = row.firstBit().index;
            const lastBitIndex = row.lastBit().index;
            if (lastChangedIndex >= firstBitIndex && lastChangedIndex <= lastBitIndex) {
              rowIndex = i;
              break;
            }
          }
        }
      }
      // Scroll the row into view, but keep #puzzle-inputs visible
      if (rowIndex !== -1
        && this.displayMatrixRef.current
        && typeof this.displayMatrixRef.current.getBitRowElement === 'function'
      ) {
        const lastChangedRow = this.displayMatrixRef.current.getBitRowElement(rowIndex);
        const mainDisplay = this.mainDisplayRef.current;
        const puzzleInputs = this.puzzleInputsRef.current;
        if (lastChangedRow && mainDisplay && puzzleInputs) {
          // Scroll the row into view within main-display
          const rowRect = lastChangedRow.getBoundingClientRect();
          const mainRect = mainDisplay.getBoundingClientRect();
          const inputsRect = puzzleInputs.getBoundingClientRect();
          // scroll the row near the top of main-display (second visible row, if possible)
          const contextFactor = 6; // Adjust this factor to control how much context is shown
          const newScrollTop = rowRect.top - mainRect.top + mainDisplay.scrollTop - (mainRect.height / contextFactor);
          mainDisplay.scrollTo({
            top: newScrollTop,
            behavior: 'smooth'
          });
          if (rowRect.bottom > mainRect.bottom) {
            // Calculate max scroll so puzzle-inputs is still visible
            const maxScroll = (inputsRect.top) - mainRect.top - lastChangedRow.offsetHeight;
            mainDisplay.scrollTop += Math.min(rowRect.bottom - mainRect.bottom, maxScroll);
          } else if (rowRect.top < mainRect.top) {
            // If row is above main-display, scroll up
            mainDisplay.scrollTop += rowRect.top - mainRect.top;
          }
        }
      }
    });
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
          // Only scroll on mobile screens
          if (isMobileScreen()) {
            // Scroll so the bottom of win-message aligns with the bottom of main-display
            const scrollOffset = winMessage.offsetTop + winMessage.offsetHeight - mainDisplay.clientHeight;
            mainDisplay.scrollTop = scrollOffset > 0 ? scrollOffset : 0;
          }
        }
      }
    }
  }

  handleInputFocus = () => {
    this.waitingForResize = true;
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = window.setTimeout(() => {
      console.log('Resize timeout triggered, adjusting main display height');
      this.adjustMainDisplayHeightForInput();
    }, 300);
  };

  handleInputBlur = () => {
    this.resizeTimeout = window.setTimeout(() => {
      console.log('Resize timeout after blur triggered, adjusting main display height');
      this.adjustMainDisplayHeightForInput();
    }, 300);
  };

  adjustMainDisplayHeightForInput = () => {
    const gameContent = this.gameContentRef.current;
    const mainDisplay = this.mainDisplayRef.current;
    if (gameContent && mainDisplay) {
      // Only adjust height/scroll if window is not much larger than main display (i.e., likely mobile)
      const windowHeight = window.innerHeight;
      const mainDisplayHeight = mainDisplay.offsetHeight;
      // If window is less than 1.5x main display, treat as mobile
      if (windowHeight < mainDisplayHeight * 1.5) {
        gameContent.style.height = windowHeight + 'px';
        gameContent.scrollIntoView({behavior: 'smooth'});
        const puzzleInputs = this.puzzleInputsRef.current;
        if (puzzleInputs) {
          puzzleInputs.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'nearest'});
        }
      } else {
        // On desktop, reset any forced height
        gameContent.style.height = '';
      }
    }
  };

  componentDidMount() {
    super.componentDidMount();
    // Attach focus handler to input after mount
    setTimeout(() => {
      const input = this.puzzleInputsRef.current?.querySelector('input');
      if (input) {
        input.addEventListener('focus', this.handleInputFocus, {passive: true});
        input.addEventListener('blur', this.handleInputBlur, {passive: true});
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
        window.scrollTo({top: scrollY + mainRect.top, behavior: 'smooth'});
      }
      // Optionally, ensure puzzle-inputs is visible (should be if main-display is at top)
      if (inputsRect.top < 0 || inputsRect.bottom > window.innerHeight) {
        window.scrollTo({top: scrollY + inputsRect.top, behavior: 'smooth'});
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
                <button type={"button"} onClick={this.props.onShareWin}>Share Your Win</button>
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
