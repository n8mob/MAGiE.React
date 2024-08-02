type Correctness = true | false | "unknown";

class BitJudgment {
  bit: string;
  isCorrect: Correctness;
  sequenceIndex: number | null;
  bitIndex: number;

  constructor(
    bit: string,
    isCorrect: Correctness = "unknown",
    bitIndex: number,
    sequenceIndex: number | null = null
  ) {
    this.bit = bit;
    this.isCorrect = isCorrect;
    this.bitIndex = bitIndex;
    this.sequenceIndex = sequenceIndex;
  }
}

export default BitJudgment;
export type { Correctness };

