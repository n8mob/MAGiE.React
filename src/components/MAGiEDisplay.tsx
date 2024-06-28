import React from 'react';
import CheckboxMatrix from './CheckboxMatrix';

interface Props {
  bits: string;
  encodingWidth: number;
  clue: string[];
}

const MAGiEDisplay: React.FC<Props> = ({bits, encodingWidth, clue}) => {
  return (
    <div>
      <div className="clue">
        {clue.map(clueLine => <p>{clueLine}</p>)}
      </div>
      <CheckboxMatrix bits={bits} encodingWidth={encodingWidth}/>
    </div>
  );
}

export default MAGiEDisplay;