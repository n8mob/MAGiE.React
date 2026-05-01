import { FC } from "react";
import { CorrectnessBitButton } from "./BitButton";
import { IndexedBit } from "../IndexedBit.ts";
import './JudgmentLegend.css';
import { Correctness } from "../judgment/BitJudgment.ts";

const JudgmentLegend: FC = () => {
  return (
    <div className="judgment-legend">
      <h3><span className="help-icon"><CorrectnessBitButton bit={{bit: "1", index: 6} as IndexedBit} correctness={Correctness.correct}/></span>
        Bit display meaning:</h3>
      <p className="legend-item">
        <span className="legend-label">Not yet guessed</span>
        <CorrectnessBitButton bit={{bit: "0", index: 0} as IndexedBit} correctness={Correctness.unguessed}/>
        <CorrectnessBitButton bit={{bit: "1", index: 1} as IndexedBit} correctness={Correctness.unguessed}/>
      </p>
      <p className="legend-item">
        <span className="legend-label">Correct</span>
        <CorrectnessBitButton bit={{bit: "1", index: 2} as IndexedBit} correctness={Correctness.correct}/>
        <CorrectnessBitButton bit={{bit: "0", index: 3} as IndexedBit} correctness={Correctness.correct}/>
      </p>
      <p className="legend-item">
        <span className="legend-label">Incorrect</span>
        <CorrectnessBitButton bit={{bit: "0", index: 4} as IndexedBit} correctness={Correctness.incorrect}/>
        <CorrectnessBitButton bit={{bit: "1", index: 5} as IndexedBit} correctness={Correctness.incorrect}/>
      </p>
    </div>
  )
    ;
};

export default JudgmentLegend;
