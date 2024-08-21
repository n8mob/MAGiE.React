import {useState, useEffect, useRef} from "react";
import {Puzzle} from "../Menu.ts";
import BinaryJudge from "../judgment/BinaryJudge.ts";
import FullJudgment from "../judgment/FullJudgment.ts";
import {SequenceJudgment} from "../judgment/SequenceJudgment.ts";
import {DisplayRow} from "../encoding/BinaryEncoder.ts";
import ReactGA4 from "react-ga4";
import {DisplayMatrixHandle} from "../components/DisplayMatrix.tsx";

const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

interface UsePuzzleProps {
  puzzle: Puzzle;
  displayWidth: number;
  onWin: () => void;
  onUpdateJudge: (puzzle: Puzzle) => void;
}

const usePuzzle = ({puzzle, displayWidth, onWin, onUpdateJudge}: UsePuzzleProps) => {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | undefined>(puzzle);
  const [judge, setJudge] = useState<BinaryJudge | null>(null);
  const [guessText, setGuessText] = useState<string>("");
  const [guessBits, setGuessBits] = useState<string>("");
  const [winBits, setWinBits] = useState<string>("");
  const [displayRows, setDisplayRows] = useState<DisplayRow[]>([]);
  const [judgment, setJudgment] = useState<FullJudgment<SequenceJudgment>>(new FullJudgment<SequenceJudgment>(
    false,
    "",
    []
  ));

  const displayMatrixRef = useRef<DisplayMatrixHandle>(null);

  useEffect(
    () => {
      const updateCurrentPuzzle = (puzzle: Puzzle) => {
        setCurrentPuzzle(puzzle);
        setJudge(null);
        setGuessBits("");
        setWinBits("");
        setDisplayRows([]);
        setJudgment(new FullJudgment<SequenceJudgment>(false, "", []));
        resetForNextPuzzle();

        if (puzzle) {
          onUpdateJudge(puzzle);
          const newWinText = puzzle.encoding.encodeText(puzzle.winText);
          setWinBits(newWinText);

          const updateJudgment = () => {
            if (currentPuzzle && judge) {
              const splitter = (bits: string) => currentPuzzle.encoding.splitForDisplay(bits || "", displayWidth);
              const newJudgment = judge.judgeBits(guessBits, winBits, splitter);
              if (newJudgment) {
                setJudgment(newJudgment);
                displayMatrixRef.current?.updateJudgements(newJudgment.sequenceJudgments);
              }
            }
          };

          updateJudgment();
        }
      };

      updateCurrentPuzzle(puzzle);

      const updateDisplayRows = () => {
        if (!currentPuzzle) {
          console.error('Missing puzzle');
          return;
        }

        const displayRowSplit = currentPuzzle.encoding.splitForDisplay(guessBits, displayWidth);
        const newDisplayRows: DisplayRow[] = [];
        let displayRow = displayRowSplit.next();
        while (displayRow && !displayRow.done) {
          newDisplayRows.push(displayRow.value);
          displayRow = displayRowSplit.next();
        }

        setDisplayRows(newDisplayRows);
        displayMatrixRef.current?.updateJudgements(judgment.sequenceJudgments);
      };

      updateDisplayRows();

    }, [currentPuzzle, displayWidth, guessBits, judge, judgment.sequenceJudgments, onUpdateJudge, puzzle, winBits]
  );

  const resetForNextPuzzle = () => {
    setGuessText("");
    setGuessBits("");
    setWinBits("");
    setJudgment(new FullJudgment<SequenceJudgment>(false, "", []));
  };

  useEffect(() => {
    preloadImages([
      'assets/Bit_off_Yellow.png',
      'assets/Bit_on_Yellow.png',
      'assets/Bit_off_Teal.png',
      'assets/Bit_on_Teal.png',
      'assets/Bit_off_Purple.png',
      'assets/Bit_on_Purple.png',
    ]);
  }, []);

  const handleSubmitClick = () => {
    if (!currentPuzzle) {
      ReactGA4.event({
        category: 'Error',
        action: 'Missing puzzle',
      });
      return;
    }
    const split = (bits: string) => currentPuzzle.encoding.splitForDisplay(bits, displayWidth);
    const newJudgment = judge?.judgeBits(guessBits, winBits, split);
    if (newJudgment) {
      ReactGA4.event(
        "GuessSubmitted",
        {
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
        onWin();
      } else {
        setJudgment(newJudgment);
        displayMatrixRef.current?.updateJudgements(newJudgment.sequenceJudgments);
      }
    }
  };

  return {
    currentPuzzle,
    guessText,
    setGuessText,
    guessBits,
    setGuessBits,
    winBits,
    displayRows,
    judgment,
    setJudge,
    displayMatrixRef,
    handleSubmitClick,
  };
};

export default usePuzzle;
