import {Puzzle} from "../Menu.ts";
import React, {useState} from "react";

interface DecodePuzzleProps {
  puzzle?: Puzzle,
  onWin: () => void,
  displayWidth: number
}

const DecodePuzzle: React.FC<DecodePuzzleProps> = ({puzzle, onWin, displayWidth}) => {
  const [guess, setGuess] = useState("");
  if (!puzzle || puzzle.type != "Decode") {
    return;
  }

  const winningBits = puzzle.encoding.encodeText(puzzle.winText);


  function handleSubmitClick() {
    if (guess == puzzle?.winText) {
      setGuess("");
      onWin?.();
    } else {
      console.log(`incorrect guess: ${guess}`)
    }
  }

  function handleGuessChange(event: React.ChangeEvent<HTMLInputElement>) : void {
    setGuess(event.target.value.toUpperCase());
  }

  return <>
    {[...winningBits].map((char, index) => (
      <React.Fragment key={`winText-${index}`}>
        <input type="checkbox" className="bit-checkbox" checked={char == '1'} />
        {(index + 1) % displayWidth == 0 && <br/>}
      </React.Fragment>
    ))}
    <p>
      <input
        type="text"
        id="decodeInput"
        value={guess}
        onChange={handleGuessChange}
      />
      <input type="button" value="Submit" onClick={handleSubmitClick}/>
    </p>
  </>
}

export default DecodePuzzle;