import {Puzzle} from "../Menu.ts";
import React, {useEffect, useState} from "react";

interface EncodePuzzleProps {
  puzzle?: Puzzle
}

const EncodePuzzle: React.FC<EncodePuzzleProps> = ({puzzle}) => {
  const [bits, setBits] = useState("");
  useEffect(() => {
    if (!puzzle) {
      return;
    } else {
      setBits(puzzle.encoding.encodeText(puzzle.init));
    }
  }, [puzzle])

  if (puzzle && puzzle.type == "Encode") {
    return <>
      {[...bits].map((char, index) =>
        <input type="checkbox" key={index} defaultChecked={char == '1'}/>
      )}
      <p>
        <input type="button" value="0" onClick={() => setBits(bits + "0")} />
        <input type="button" value="1" onClick={() => setBits(bits + "1")} />
      </p>
      <p>
        <input type="button" value="Submit" onClick={() => console.log(`decoded: ${puzzle.encoding.decodeText(bits)}`)} />
      </p>
    </>
  }
}

export default EncodePuzzle;
