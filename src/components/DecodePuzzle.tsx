import { BasePuzzle, PuzzleProps, PuzzleState } from "./BasePuzzle.tsx";
import { DisplayMatrix } from "./DisplayMatrix";
import { BitSequence } from "../BitSequence.ts";
import ReactGA4 from "react-ga4";
import { Link } from "react-router-dom";
import { ChangeEvent } from "react";
import { DisplayRow } from "../encoding/DisplayRow.ts";

class DecodePuzzle extends BasePuzzle {
  constructor(props: PuzzleProps) {
    super(props);
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


  *splitForDisplay(displayWidth: number): Generator<DisplayRow, void> {
    if (!this.state.currentPuzzle) {
      return;
    }
    yield* this.state.currentPuzzle.encoding.splitForDisplay(this.state.winBits, displayWidth);
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
        <div id="main-display" className="display">
          {[...currentPuzzle.clue].map((clueLine, clueIndex) => <p key={clueIndex}>{clueLine}</p>)}
          <DisplayMatrix
            ref={this.displayMatrixRef}
            displayRows={displayRows}
            judgments={judgment.sequenceJudgments}
            handleBitClick={() => {}} // Bits remain read-only
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
