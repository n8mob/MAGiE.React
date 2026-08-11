import { Correctness } from "../judgment/BitJudgment.ts";
import { IndexedBit } from "../IndexedBit.ts";
import { ChangeEvent, FC, MouseEventHandler, PointerEvent, useEffect, useRef } from "react";
import { loadSound, playSound, primeAudio } from "../audio/SoundPlayer.ts";
import { DEFAULT_OFF_SOUND, DEFAULT_ON_SOUND } from "../hooks/useBitSounds.ts";

/**
 * How long after a pointer toggle we ignore a click/change on the same button.
 * Only has to outlast the browser's synthetic-click delay, not a real gesture.
 */
const SYNTHETIC_CLICK_WINDOW_MS = 700;

interface BitButtonProps {
  bit: IndexedBit;
  /** Prevent every input path from changing this bit. */
  disabled?: boolean;
  /**
   * Called with the bit's global index when the player toggles it.
   *
   * Fires on pointerdown rather than the checkbox's change event. Tapping two
   * neighbouring bits quickly makes mobile Safari retarget the second tap's
   * synthetic click onto the first bit, which toggles that bit back off and
   * leaves the second one untouched — the whole gesture reads as unresponsive.
   * pointerdown/touchstart always carry the true target, so we act on those and
   * swallow the synthetic click that follows. See issue #186.
   */
  onBitToggle?: (bitIndex: number) => void;
  onClick?: MouseEventHandler<HTMLInputElement>;
  /**
   * Play a tap when this button is toggled. Off by default: components whose
   * bits can also change from the keyboard or the on-screen inputs should use
   * the useBitSounds hook instead, which covers every path. Turning both on
   * would double up.
   */
  playSounds?: boolean;
  onSound?: string;
  offSound?: string;
  soundVolume?: number;
}

interface BitButtonHandlers {
  onPointerDown: (event: PointerEvent<HTMLInputElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/** Shared toggle + sound wiring for both button flavors. */
function useBitButtonHandlers(
  {
    onBitToggle = () => {},
    disabled = false,
    playSounds = false,
    onSound = DEFAULT_ON_SOUND,
    offSound = DEFAULT_OFF_SOUND,
    soundVolume = 0.25,
  }: BitButtonProps): BitButtonHandlers {
  const lastPointerToggle = useRef(0);

  useEffect(() => {
    if (!playSounds) {return;}
    void loadSound(onSound);
    void loadSound(offSound);
  }, [playSounds, onSound, offSound]);

  const toggle = (input: HTMLInputElement, willBeChecked: boolean) => {
    const raw = input.dataset.bitIndex;
    if (raw === undefined) {return;}
    const index = parseInt(raw);
    if (Number.isNaN(index)) {return;}
    if (playSounds) {
      primeAudio();
      playSound(willBeChecked ? onSound : offSound, soundVolume);
    }
    onBitToggle(index);
  };

  return {
    onPointerDown: (event: PointerEvent<HTMLInputElement>) => {
      if (disabled) {return;}
      const input = event.currentTarget;
      // Stop the browser toggling `checked` itself and emitting a compat click.
      // These are controlled checkboxes, so React re-renders the new state.
      event.preventDefault();
      lastPointerToggle.current = performance.now();
      toggle(input, !input.checked);
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      if (disabled) {return;}
      // Keyboard activation lands here. A change right after our own pointerdown
      // is the synthetic click (possibly retargeted from a neighbour) — drop it.
      if (performance.now() - lastPointerToggle.current < SYNTHETIC_CLICK_WINDOW_MS) {
        return;
      }
      toggle(event.target, event.target.checked);
    },
  };
}

const BitButton: FC<BitButtonProps> = (props) => {
  const { bit, disabled = false, onClick = () => {} } = props;
  const { onPointerDown, onChange } = useBitButtonHandlers(props);
  return (
    <input
      type="checkbox"
      className="bit-checkbox"
      onPointerDown={onPointerDown}
      onChange={onChange}
      onClick={onClick}
      checked={bit.bit === "1"}
      disabled={disabled}
      data-bit-index={bit.index}
    />
  );
};

interface CorrectnessBitButtonProps extends BitButtonProps {
  correctness: Correctness;
}

const CorrectnessBitButton: FC<CorrectnessBitButtonProps> = (props) => {
  const { bit, correctness, disabled = false, onClick = () => {} } = props;
  const { onPointerDown, onChange } = useBitButtonHandlers(props);
  return (
    <input
      type="checkbox"
      className="bit-checkbox"
      onPointerDown={onPointerDown}
      onChange={onChange}
      onClick={onClick}
      checked={bit.bit === "1"}
      disabled={disabled}
      data-correctness={correctness}
      data-bit-index={bit.index}
    />
  );
};

export { BitButton, CorrectnessBitButton };
export type { BitButtonProps, CorrectnessBitButtonProps };
