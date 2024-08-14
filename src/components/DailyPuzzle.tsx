import {Component} from "react";
import EncodePuzzle from "./EncodePuzzle.tsx";
import DecodePuzzle from "./DecodePuzzle.tsx";
import {FixedWidthEncodingData, Puzzle, VariableEncodingData} from "../Menu.ts";
import {getDailyPuzzleForDate} from "../PuzzleApi.ts";
import FixedWidthEncoder from "../encoding/FixedWidthEncoder.ts";
import VariableWidthEncoder from "../encoding/VariableWidthEncoder.ts";

interface DailyPuzzleProps {
  puzzle: Puzzle;
  date: Date;
}

interface DailyPuzzleState {
  currentPuzzle: Puzzle;
  date: Date;
  formattedDate: string;
  winMessage: string[];
  hasWon: boolean;
}

export default class DailyPuzzle extends Component<DailyPuzzleProps, DailyPuzzleState> {
  constructor(props: DailyPuzzleProps) {
    super(props);
    this.state = {
      currentPuzzle: props.puzzle,
      date: props.date,
      formattedDate: this.formatDate(props.date),
      winMessage: props.puzzle.winMessage,
      hasWon: false,
    };

    this.formatDate = this.formatDate.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    this.handleWin = this.handleWin.bind(this);
    this.handleShareWin = this.handleShareWin.bind(this);
  }

  formatDate(date: Date) {
    const prettyOptions: Intl.DateTimeFormatOptions = {weekday: 'long', month: 'long', day: 'numeric'};
    const userLocale = navigator.language;
    return date.toLocaleDateString(userLocale, prettyOptions);
  }

  componentDidUpdate(prevProps: Readonly<DailyPuzzleProps>) {
    const {date} = this.props;
    const fetchPuzzleForDate = async () => {
      try {
        const puzzleData = await getDailyPuzzleForDate(
          date.getFullYear(),
          date.getMonth() + 1,
          date.getDate()
        );
        const puzzle: Puzzle = puzzleData.puzzle;
        let encodingData: FixedWidthEncodingData | VariableEncodingData;
        if (puzzleData.encoding.type == "fixed") {
          encodingData = puzzleData.encoding.encoding as FixedWidthEncodingData;
          puzzle.encoding = new FixedWidthEncoder(encodingData.encoding.width, encodingData.encoding.encodingMap);
        } else {
          encodingData = puzzleData.encoding as VariableEncodingData;
          puzzle.encoding = new VariableWidthEncoder(encodingData.encoding);
        }
      } catch (error) {
        console.error('Failed to fetch daily puzzle:', error);
      }
    };

    fetchPuzzleForDate().catch(error => console.error('Error fetching daily puzzle.', error));
    if (prevProps.puzzle !== this.props.puzzle) {
      this.setState({
        currentPuzzle: this.props.puzzle,
        formattedDate: this.formatDate(this.props.date),
        winMessage: this.props.puzzle.winMessage,
        hasWon: false,
      });
    }
  }

  render() {
    const {currentPuzzle, formattedDate, hasWon, winMessage} = this.state;

    if (!currentPuzzle) {
      return <div>Loading...</div>;
    } else {
      return <>
        <h2>Daily Puzzle<br />{formattedDate}</h2>
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
    const {formattedDate} = this.state
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
          .then(() => {alert("The share message has been copied to your clipboard.");})
          .catch(error => {
            console.error('Failed to copy text: ', error);
            alert("Sorry, we couldn't copy the text to your clipboard either.");
          });
      }
    } else {
      const message = 'It seems that this browser supports '
      + 'neither web share nor programmatic clipboard access.\n\n'
      + 'The following message was prepared for sharing:\n\n'
      + shareText;
      alert(message);
    }
  }
}

