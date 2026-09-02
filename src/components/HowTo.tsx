import { Link } from "react-router-dom";
import BitLegend from "./BitLegend.tsx";

export default function FirstTimeContent() {
  return (
    <>
      <h2>Welcome to <span className="magie-case">MAGiE</span>!</h2>
      <p>It's a puzzle game.
        It's set in a totally rad mall! But we didn't draw that part yet. (Art is hard!)</p>
      <BitLegend />
      <h3>NEW MODE!</h3>
      <h4>Code name: "Chocolate"</h4>
      <ul>
        <li>Bits scroll up automatically.</li>
        <li>Your job is to encode the letter on each row.</li>
        <li>The letter to encode is on the left.</li>
        <li>The letter currently encoded by the row is on the right. (That's helpful!)</li>
        <li>When the row is correctly encoded, it turns teal.</li>
        <li>Rows encode the space character by default. So, if there is a space in the message, you get that row for
          free. (You will see that it is already teal.)
        </li>
        <li>An example:
          <div className="bit-field">
            <p className="letter-correct"><span className="row-gutter">R</span>
              <input className="bit-checkbox" data-correctness="correct" data-bit-index="25" type="checkbox" readOnly={true} checked={true} />
              <input className="bit-checkbox" data-correctness="correct" data-bit-index="26" type="checkbox" readOnly={true} checked={false} />
              <input className="bit-checkbox" data-correctness="correct" data-bit-index="27" type="checkbox" readOnly={true} checked={false} />
              <input className="bit-checkbox" data-correctness="correct" data-bit-index="28" type="checkbox" readOnly={true} checked={true} />
              <input className="bit-checkbox" data-correctness="correct" data-bit-index="29" type="checkbox" readOnly={true} checked={false} />
              <span className="annotation">&nbsp;R</span></p>
            <p className="letter-incorrect"><span className="row-gutter">E</span>
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="40" type="checkbox" readOnly={true} checked={false} />
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="41" type="checkbox" readOnly={true} checked={false} />
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="42" type="checkbox" readOnly={true} checked={false} />
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="43" type="checkbox" readOnly={true} checked={false} />
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="44" type="checkbox" readOnly={true} checked={false} />
              <span className="annotation">&nbsp;_</span></p>
            <p className="letter-incorrect"><span className="row-gutter">A</span>
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="30" type="checkbox" readOnly={true} checked={false} />
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="31" type="checkbox" readOnly={true} checked={false} />
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="32" type="checkbox" readOnly={true} checked={true} />
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="33" type="checkbox" readOnly={true} checked={true} />
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="34" type="checkbox" readOnly={true} checked={true} />
              <span className="annotation">&nbsp;G</span></p>
            <p className="letter-incorrect focused-row"><span className="row-gutter">D</span>
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="35" type="checkbox" readOnly={true} checked={false} />
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="36" type="checkbox" readOnly={true} checked={false} />
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="37" type="checkbox" readOnly={true} checked={false} />
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="38" type="checkbox" readOnly={true} checked={false} />
              <input className="bit-checkbox" data-correctness="incorrect" data-bit-index="39" type="checkbox" readOnly={true} checked={true} />
              <span className="annotation">&nbsp;A</span></p>
          </div>
        </li>
      </ul>
      <h3>📅 Daily Puzzles </h3>
      <p>Each day we'll post a puzzle at:
        <Link  to={"/today"}>magiegame.com/today</Link>
      </p>
    </>
  );
}
