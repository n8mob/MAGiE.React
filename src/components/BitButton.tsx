import { Correctness } from "../judgment/BitJudgment.ts";
import { IndexedBit } from "../IndexedBit.ts";
import { ChangeEvent, ChangeEventHandler, FC, MouseEventHandler, useEffect } from "react";
import { loadSound, playSound, primeAudio } from "../audio/SoundPlayer.ts";
import { DEFAULT_OFF_SOUND, DEFAULT_ON_SOUND } from "../hooks/useBitSounds.ts";

interface BitButtonProps {
  bit: IndexedBit;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onClick?: MouseEventHandler<HTMLInputElement>;
  /**
   * Play a tap when this button is clicked. Off by default: components whose
   * bits can also change from the keyboard or the on-screen inputs should use
   * the useBitSounds hook instead, which covers every path. Turning both on
   * would double up on clicks.
   */
  playSounds?: boolean;
  onSound?: string;
  offSound?: string;
  soundVolume?: number;
}

/** Shared click-to-tap wiring for both button flavors. */
function useBitButtonSounds(
  {
    playSounds = false,
    onSound = DEFAULT_ON_SOUND,
    offSound = DEFAULT_OFF_SOUND,
    soundVolume = 0.25,
    onChange = () => {},
  }: BitButtonProps): ChangeEventHandler<HTMLInputElement> {
  useEffect(() => {
    if (!playSounds) {return;}
    void loadSound(onSound);
    void loadSound(offSound);
  }, [playSounds, onSound, offSound]);

  if (!playSounds) {return onChange;}

  return (event: ChangeEvent<HTMLInputElement>) => {
    primeAudio();
    playSound(event.target.checked ? onSound : offSound, soundVolume);
    onChange(event);
  };
}

const BitButton: FC<BitButtonProps> = (props) => {
  const { bit, onClick = () => {} } = props;
  const handleChange = useBitButtonSounds(props);
  return (
    <input
      type="checkbox"
      className="bit-checkbox"
      onChange={handleChange}
      onClick={onClick}
      checked={bit.bit === "1"}
      data-bit-index={bit.index}
      key={`bit-${bit.index}`}
    />
  );
};

interface CorrectnessBitButtonProps extends BitButtonProps {
  correctness: Correctness;
}

const CorrectnessBitButton: FC<CorrectnessBitButtonProps> = (props) => {
  const { bit, correctness, onClick = () => {} } = props;
  const handleChange = useBitButtonSounds(props);
  return (
    <input
      type="checkbox"
      className="bit-checkbox"
      onChange={handleChange}
      onClick={onClick}
      checked={bit.bit === "1"}
      data-correctness={correctness}
      data-bit-index={bit.index}
      key={`bit-${bit.index}`}
    />
  );
};

export { BitButton, CorrectnessBitButton };
export type { BitButtonProps, CorrectnessBitButtonProps };
