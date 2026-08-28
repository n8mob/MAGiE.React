import { FC } from "react";
import './BitLegend.css';
import bitOnTeal from '../assets/Bit_on_Teal.png';
import bitOffTeal from '../assets/Bit_off_Teal.png';
import bitOffPurple from '../assets/Bit_off_Purple.png';
import bitOnPurple from '../assets/Bit_on_Purple.png';

const BitLegend: FC = () => {
  return (
    <div className="bit-legend">

      {/*<h3><span className="help-icon"><CorrectnessBitButton bit={{ bit: "1", index: 6 } as IndexedBit} correctness={Correctness.correct}/></span>*/}
      <h3><span className="help-icon"><img src={bitOnTeal} alt={"An image representing an .on. bit rendered in the teal color to indicate that it is correct."} />
        </span>
        Bit display</h3>
      <table>
        <thead><tr className={"legend-label"}><th>Judgment</th><th>.OFF.</th><th>.ON.</th></tr></thead>
        <tbody id={"plain-image-bit-legend"}>
          <tr>
            <th className={"legend-label"}>Correct</th>
            <td><span className={"legend-item"}><img src={bitOffTeal} alt={"b-off-t"} /></span></td>
            <td><span className={"legend-item"}><img src={bitOnTeal} alt={"b-on-t"} /></span></td>
          </tr>
          <tr>
            <th className={"legend-label"}>Incorrect</th>
            <td><span className={"legend-item"}><img src={bitOffPurple} alt={"b-off-p"} /></span></td>
            <td><span className={"legend-item"}><img src={bitOnPurple} alt={"b-on-p"} /></span></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
    ;
};

export default BitLegend;
