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

  constructor(props: PuzzleProps) {
    super(props);
    this.gameContentRef = createRef<HTMLDivElement>();
    this.mainDisplayRef = createRef<HTMLDivElement>();
    this.clueRef = createRef<HTMLDivElement>();
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

  handleInputFocus = () => {
    console.log('puzzle input got focus, pausing for animation.', Date.now());

    setTimeout(() => {
      this.scrollCluesToTop();
      this.adjustPuzzleInputPosition();
    }, 500); // Adjust delay as needed for keyboard animation
  };

  private scrollCluesToTop() {
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    console.log(`viewportHeight after keyboard animation: ${viewportHeight}`);

    const mainDisplay = this.mainDisplayRef.current;
    if (mainDisplay) {
      // Get the main display's offset from the top of the document
      const mainDisplayOffsetTop = mainDisplay.offsetTop;
      const mainDisplayHeight = mainDisplay.offsetHeight;

      // Calculate the bottom position of the main display
      const mainDisplayBottom = mainDisplayOffsetTop + mainDisplayHeight;
      console.log(`mainDisplayOffsetTop: ${mainDisplayOffsetTop}, mainDisplayHeight: ${mainDisplayHeight}, mainDisplayBottom: ${mainDisplayBottom}`);

      // If the bottom of the main display is below the viewport height (keyboard covers it), adjust scrolling
      if (mainDisplayBottom > viewportHeight) {
        console.log('Adjusting scroll to reveal main display...');
        window.scrollTo({
          top: mainDisplayOffsetTop,
          behavior: 'smooth'
        });
      } else {
        console.log('No scroll adjustment needed.');
      }
    }
  }

  componentDidMount() {
    super.componentDidMount();
    // Listen for viewport size changes
    window.visualViewport?.addEventListener('resize', this.adjustPuzzleInputPosition);
    this.adjustPuzzleInputPosition();
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    // Clean up listener
    window.visualViewport?.removeEventListener('resize', this.adjustPuzzleInputPosition);
  }

  adjustPuzzleInputPosition = () => {
    const puzzleInputs = document.getElementById('puzzle-inputs');
    if (!puzzleInputs) {
      console.warn('Puzzle inputs element not found.');
      return;
    }

    console.log(`#puzzle-inputs before adjustment: height: ${puzzleInputs.offsetHeight} top: ${puzzleInputs.offsetTop} bottom: ${puzzleInputs.style.bottom}`);

    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const windowHeight = window.innerHeight;
    const keyboardHeight = windowHeight - viewportHeight;
    console.log(`Viewport height: ${viewportHeight}, Window height: ${windowHeight}, Keyboard height: ${keyboardHeight}`);

    // Adjust bottom position based on keyboard height
    puzzleInputs.style.bottom = `${keyboardHeight}px`;
    console.log(`#puzzle-inputs after adjustment: height: ${puzzleInputs.offsetHeight} top: ${puzzleInputs.offsetTop}, bottom: ${puzzleInputs.style.bottom}`);
  };

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
            <div id="puzzle-inputs">
              <input type="text"
                     inputMode="text"
                     className="decode-input"
                     placeholder={'DECODE TEXT HERE'}
                     autoComplete="off"
                     autoCorrect="off"
                     spellCheck="false"
                     value={guessText}
                     onFocus={this.handleInputFocus}
                     onChange={this.handleGuessUpdate}
                     enterKeyHint={"done"}/>
            </div>
          )}
        </div>
      </>);
  }
}

export { DecodePuzzle };
