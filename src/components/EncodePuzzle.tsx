import {Puzzle} from "../Menu.ts";
import React, {useEffect, useState} from "react";

interface EncodePuzzleProps {
  puzzle?: Puzzle
}

const EncodePuzzle: React.FC<EncodePuzzleProps> = ({puzzle}) => {
  const [bits, setBits] = useState("");

  useEffect(() => {
    if (!puzzle || puzzle.type != "Encode") {
      return;
    } else {
      const splitBits: string[] = [...puzzle.encoding.encodeAndSplit(puzzle.init)];
      setBits(splitBits.join(''));
    }
  }, [puzzle]);

  const bitSplitter = puzzle?.encoding.splitBits(bits);
  let nextBits = bitSplitter?.next();
  const bitsByChar: string[] = [];

  while (nextBits && !nextBits?.done) {
    bitsByChar.push(nextBits.value);
    nextBits = bitSplitter?.next();
  }

  function handleBitClick(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event) {
      return;
    } else {
      const bitIndex = parseInt(event.currentTarget.getAttribute("data-bitindex") || "0");
      const charIndex = parseInt(event.currentTarget.getAttribute("data-charindex") || "0");
      const newBits = [...bitsByChar[charIndex]];
      newBits[bitIndex] = event.currentTarget.checked ? "1" : "0";
      bitsByChar[charIndex] = newBits.join('');
      setBits(bitsByChar.join(''));
    }
  }

  return <>
    {bitsByChar.map((char, charIndex) => {
        return <p key={`char${charIndex}`}>
          {[...char].map((bit, bitIndex) => (
            <input type="checkbox"
                   key={`bit${bitIndex}`}
                   value={bit}
                   checked={bit == "1"}
                   data-charindex={charIndex}
                   data-bitindex={bitIndex}
                   onChange={(e) => handleBitClick(e)}
            />
          ))}
        </p>
      }
    )}
    <div id="encodingInputs">
      <p>
        <input type="button" value="0" onClick={() => setBits(bits + "0")}/>
        <input type="button" value="1" onClick={() => setBits(bits + "1")}/>
      </p>
      <p>
        <input type="button" value="Submit"
               onClick={() => console.log(`decoded: ${puzzle?.encoding.decodeText(bits)}`)}/>
      </p>
    </div>
  </>;
}

export default EncodePuzzle;
