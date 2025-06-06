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

  constructor(props: PuzzleProps) {
    super(props);
    this.gameContentRef = createRef<HTMLDivElement>();
    this.mainDisplayRef = createRef<HTMLDivElement>();
    this.clueRef = createRef<HTMLDivElement>();
    this.winMessageRef = createRef<HTMLDivElement>(); // Initialize ref
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
            <div id="puzzle-inputs">
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
