import {Component} from "react";
import EncodePuzzle from "./EncodePuzzle.tsx";
import DecodePuzzle from "./DecodePuzzle.tsx";
import {Puzzle} from "../Menu.ts";

interface DailyPuzzleProps {
  puzzle: Puzzle;
}

interface DailyPuzzleState {
  currentPuzzle: Puzzle;
  winMessage: string[];
  hasWon: boolean;
}

export default class DailyPuzzle extends Component<DailyPuzzleProps, DailyPuzzleState> {
  constructor(props: DailyPuzzleProps) {
    super(props);

    this.state = {
      currentPuzzle: props.puzzle,
      winMessage: props.puzzle.winMessage,
      hasWon: false,
    };

    this.handleWin = this.handleWin.bind(this);
  }

  componentDidUpdate(prevProps: Readonly<DailyPuzzleProps>) {
    if (prevProps.puzzle !== this.props.puzzle) {
      this.setState({
        currentPuzzle: this.props.puzzle,
        winMessage: this.props.puzzle.winMessage,
        hasWon: false,
      });
    }
  }

  render() {
    const {currentPuzzle, hasWon, winMessage} = this.state;

    if (!currentPuzzle) {
      return <div>Loading...</div>;
    } else {
      return <>
        <div className="display">
          {currentPuzzle.clue.map((line, index) => <p key={`clue-line-${index}`}>{line}</p>)}
        </div>
        {currentPuzzle.type === "Encode" ? (
          <EncodePuzzle puzzle={currentPuzzle} onWin={this.handleWin} displayWidth={7}/>
        ) : (
          <DecodePuzzle puzzle={currentPuzzle} onWin={this.handleWin} displayWidth={7}/>
        )}
        {hasWon && <div>
          <div className="display">
            {winMessage.map((line, index) => <p key={`winMessageLine-${index}`}>{line}</p>)}
          </div>
          <div className="share-controls">
            <button onClick={this.handleShareWin}>Share Your Win</button>
          </div>
        </div>}
      </>
    }
  }

  handleWin() {
    this.setState({hasWon: true});
  }

  handleShareWin() {
    if (navigator.share) {
      navigator.share({
        title: "MAGiE Game",
        text: "Check out this puzzle I solved!",
        url: window.location.href,
      })
        .catch(console.error);
    } else {
      alert('It seems that the "Web Share" API is not supported in your browser');
    }
  }
  }

