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
    const today = new Date();
    const testLocales = [
      'en-US',
      'en-GB',
      'fr-FR',
      'de-DE',
      'zh-CN',
      'ja-JP',
      'ar-SA',
      'he-IL',
      'ru-RU',
      'es-MX',
    ];

    const prettyOptions: Intl.DateTimeFormatOptions = {weekday: 'short', month: 'long', day: 'numeric'};

    testLocales.map(userLocale => {
      const formattedDate = today.toLocaleDateString(userLocale, prettyOptions);
      const shareText = `deployment test (${formattedDate})`;
      console.log(shareText);
    });

    const userLocale = navigator.language;
    const formattedDate = today.toLocaleDateString(userLocale, prettyOptions);
    const shareText = `I decoded today's MAGiE puzzle! (${formattedDate})`;
    if (navigator.share) {
      navigator.share({
        title: "MAGiE binary puzzles",
        text: shareText,
        url: window.location.href,
      })
        .catch(console.error);
    } else if (navigator.clipboard) {
      const shareViaClipboard =
        'It seems that this browser does not support "Web Share".'
        + '\nShall we copy the share message to your clipboard?';
      if (window.confirm(shareViaClipboard)) {
        navigator.clipboard.writeText(shareText)
          .catch(error => {
            console.error('Failed to copy text: ', error);
            alert("Sorry, we couldn't copy the text to your clipboard either.");
          });
      }
    }
  }
}

