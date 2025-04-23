import React from "react";
import { PuzzleProps, PuzzleState } from "./BasePuzzle.tsx";
import DisplayMatrix from "./DisplayMatrix";
import BasePuzzle from "./BasePuzzle";
import ReactGA4 from "react-ga4";
import { Link } from "react-router-dom";

class DecodePuzzle extends BasePuzzle<PuzzleProps, PuzzleState> {
  handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "Enter":
        this.handleSubmitClick();
        break;
      default:
        break;
    }
  }

  handleGuessUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newGuessText = event.target.value.toUpperCase();
    const newState = {
      guessText: newGuessText,
      guessBits: this.state.currentPuzzle?.encoding.encodeText(newGuessText) || "",
    };
    this.setState(newState);
  };

  render() {
    const {currentPuzzle, judgment, guessText, winBits} = this.state;
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
            bits={winBits}
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
                  to={"/test/2025/04/04"}
                  onClick={() => {
                    ReactGA4.event('story_start_clicked', {
                      source: 'post-win-link',
                      puzzle_slug: currentPuzzle.slug,
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
