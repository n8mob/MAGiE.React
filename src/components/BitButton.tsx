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
// Deliberately generous: finger wobble and tiny attempted scroll adjustments
// should still count as a tap. A real vertical pan quickly exceeds this.
const TAP_MOVE_TOLERANCE_PX = 18;

interface BitButtonProps {
  bit: IndexedBit;
  /** Prevent every input path from changing this bit. */
  disabled?: boolean;
  /**
   * Called with the bit's global index when the player toggles it.
   *
   * Uses the pointer gesture rather than the checkbox's change event. Tapping two
   * neighbouring bits quickly makes mobile Safari retarget the second tap's
   * synthetic click onto the first bit, which toggles that bit back off and
   * leaves the second one untouched — the whole gesture reads as unresponsive.
   * We remember the true pointer target, commit on pointerup only if it did not
   * become a scroll, and swallow the synthetic click that follows. See #186.
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
  onPointerMove: (event: PointerEvent<HTMLInputElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLInputElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLInputElement>) => void;
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
  const activePointer = useRef<{
    id: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

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
      activePointer.current = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      };
      // Suppress the compatibility change even when this gesture becomes a pan.
      lastPointerToggle.current = performance.now();
    },
    onPointerMove: (event: PointerEvent<HTMLInputElement>) => {
      const active = activePointer.current;
      if (!active || active.id !== event.pointerId || active.moved) {return;}
      const dx = event.clientX - active.startX;
      const dy = event.clientY - active.startY;
      if (dx * dx + dy * dy > TAP_MOVE_TOLERANCE_PX * TAP_MOVE_TOLERANCE_PX) {
        active.moved = true;
      }
    },
    onPointerUp: (event: PointerEvent<HTMLInputElement>) => {
      const active = activePointer.current;
      activePointer.current = null;
      if (disabled || !active || active.id !== event.pointerId || active.moved) {return;}
      // This was a tap. Prevent the checkbox's compatibility click/change from
      // applying the same gesture a second time; React owns `checked`.
      event.preventDefault();
      lastPointerToggle.current = performance.now();
      toggle(event.currentTarget, !event.currentTarget.checked);
    },
    onPointerCancel: (event: PointerEvent<HTMLInputElement>) => {
      if (activePointer.current?.id === event.pointerId) {
        activePointer.current = null;
      }
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
  const handlers = useBitButtonHandlers(props);
  return (
    <input
      type="checkbox"
      className="bit-checkbox"
      {...handlers}
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
  const handlers = useBitButtonHandlers(props);
  return (
    <input
      type="checkbox"
      className="bit-checkbox"
      {...handlers}
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
