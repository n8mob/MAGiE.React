import { FC, useState } from "react";
import { EncodePuzzle } from "./EncodePuzzle.tsx";
import { DecodePuzzle } from "./DecodePuzzle.tsx";
import { PuzzleProps } from "./useBasePuzzle.ts";
import { splitIntoShots } from "../twoShot.ts";
import { useActivationGuard } from "../hooks/useActivationGuard.ts";
import { playSound } from "../audio/SoundPlayer.ts";
import { SOUNDS } from "../audio/sounds.ts";

/**
 * The twoShot sequencer: decode the clue, then encode the answer. Each shot is
 * an ordinary puzzle played by the existing Decode/Encode components, so only
 * the final shot reports to PlayPuzzle — the decode shot's win just offers the
 * way on to the next shot.
 */
const TwoShotPuzzle: FC<PuzzleProps> = ({
  puzzle,
  onWin,
  onShareWin,
  winActions,
  winInline = false,
  bitButtonWidthPx,
}) => {
  const { decodeShot, finalShot } = splitIntoShots(puzzle);
  const [onFinalShot, setOnFinalShot] = useState(decodeShot === null);

  // Appears on the decode shot's win, like the route's own Next button, so it
  // needs the same guard against the winning tap's stray click.
  const nextShotControl = useActivationGuard(() => setOnFinalShot(true));

  if (!onFinalShot && decodeShot) {
    return (
      <DecodePuzzle
        puzzle={decodeShot}
        onWin={() => playSound(SOUNDS.win)}
        winActions={<button type="button" {...nextShotControl}>Next shot ▶</button>}
        winInline={winInline}
        bitButtonWidthPx={bitButtonWidthPx}
      />
    );
  }

  const FinalShot = finalShot.type === "Encode" ? EncodePuzzle : DecodePuzzle;
  return (
    <FinalShot
      puzzle={finalShot}
      onWin={onWin}
      onShareWin={onShareWin}
      winActions={winActions}
      winInline={winInline}
      bitButtonWidthPx={bitButtonWidthPx}
    />
  );
};

export { TwoShotPuzzle };
