import {Puzzle} from "../Menu.ts";
import React, {useEffect, useReducer, useState} from "react";
import FullJudgment from "../FullJudgment.ts";
import {Bits} from "../CharJudgment.ts";

interface EncodePuzzleProps {
  puzzle?: Puzzle;
  onWin: () => void;
}

function bitsReducer(
  bits: string,
  update: {
    action: string;
    value: string;
  }): string {
  switch (update.action) {
    case "0":
    case "1":
      return bits + update.action;
    case "Backspace":
      return bits.slice(0, -1);
    case "Update":
      return update.value;
    default:
      return bits;
  }
}

const EncodePuzzle: React.FC<EncodePuzzleProps> = ({puzzle, onWin}) => {
  const [bits, dispatch] = useReducer(bitsReducer, "");
  const [judgment, setJudgment] = useState(new FullJudgment<Bits>(false, "", []));

  useEffect(() => {
    if (!puzzle || puzzle.type != "Encode") {
      return;
    } else {
      dispatch({action: "Update", value: puzzle.encoding.encodeText(puzzle.init)});
    }
  }, [puzzle]);

  useEffect(() => {
      const handleKeyPress = (event: KeyboardEvent) => {
        // Ignore key presses in input fields (text box)
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
          return;
        } else {
          switch (event.key) {
            case "0":
            case "1":
            case "Backspace":
              dispatch({action: event.key, value: event.key});
              event.preventDefault(); // Prevent the default back navigation in browsers
              break;
            default:
              break; // Ignore other keys
          }
        }
      };

      window.addEventListener("keydown", handleKeyPress);

      return () => {
        window.removeEventListener("keydown", handleKeyPress);
      };
    }, [bits]
  )
  ; // Depend on bits to ensure the latest state is used

  if (!puzzle || puzzle.type != "Encode") {
    return;
  }

  const bitsByChar: string[] = [];
  if (bits !== undefined) {
    const bitSplitter = puzzle?.encoding.splitEncodedBits(bits);
    let nextBits = bitSplitter?.next();

    while (nextBits && !nextBits?.done) {
      bitsByChar.push(nextBits.value);
      nextBits = bitSplitter?.next();
    }
  }

  return <>
    <div className="encodingInputs stickyContainer">
      <p>
        <input type="button" className="bitInput" value="0" onClick={() => dispatch({action: "0", value: "0"})}/>
        <input type="button" className="bitInput" value="1" onClick={() => dispatch({action: "1", value: "1"})}/>
        <input type="button" className="bitInput" value="⌫"
               onClick={() => dispatch({action: "Backspace", value: "Backspace"})}/>
      </p>
    </div>
    {bitsByChar.map((char, charIndex) => {
        let className: string = "bit-checkbox";
        if (judgment && judgment.charJudgments && judgment.charJudgments.length > charIndex) {
          className += (judgment.charJudgments[charIndex].isCharCorrect ? " correct" : " incorrect");
        } else {
          className += " unknown";
        }
        return <p key={`char${charIndex}`}>
          {[...char].map((bit, bitIndex) => (
            <label className={`${className} bit-checkbox`} key={`bit${bitIndex}`}>
              <input type="checkbox"
                     value={bit}
                     checked={bit == "1"}
                     data-charindex={charIndex}
                     data-bitindex={bitIndex}
                     onChange={(e) => handleBitClick(e)}
              />
              <span></span> {/* This span is used for custom checkbox styling */}
            </label>
          ))}
        </p>;
      }
    )}
    <div className="encodingInputs">
      <p>
        <input type="button" className="bitInput" value="0" onClick={() => dispatch({action: "0", value: "0"})}/>
        <input type="button" className="bitInput" value="1" onClick={() => dispatch({action: "1", value: "1"})}/>
        <input type="button" className="bitInput" value="⌫"
               onClick={() => dispatch({action: "Backspace", value: "Backspace"})}/>
      </p>
      <p>
        <input type="button" value="Submit" onClick={handleSubmitClick}/>
      </p>
    </div>
  </>;

  function handleBitClick(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event) {
      return;
    }

    const bitIndex = parseInt(event.currentTarget.getAttribute("data-bitindex") || "0");
    const charIndex = parseInt(event.currentTarget.getAttribute("data-charindex") || "0");
    const newBits = [...bitsByChar[charIndex]];
    newBits[bitIndex] = event.currentTarget.checked ? "1" : "0";
    bitsByChar[charIndex] = newBits.join('');
    dispatch({action: "Update", value: bitsByChar.join('')});
  }

  function handleSubmitClick() {
    if (!puzzle) {
      console.error('Missing puzzle');
      return;
    } else {
      const winBits = puzzle.encoding.encodeText(puzzle.winText);
      const newJudgment = puzzle.encoding.judgeBits(bits, winBits);
      if (newJudgment.isCorrect) {
        onWin?.();
      } else {
        setJudgment(newJudgment);
      }
    }
  }
}

export default EncodePuzzle;
