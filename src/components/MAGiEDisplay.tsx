import React from 'react';

interface Props {
  lines: string[]
}

const MAGiEDisplay: React.FC<Props> = ({lines}) => {
  return (
    <div>
      <div className="display">
        {lines.map(clueLine => <p>{clueLine}</p>)}
      </div>
    </div>
  );
}

export default MAGiEDisplay;
