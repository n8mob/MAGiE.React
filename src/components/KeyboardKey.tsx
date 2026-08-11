import { FC, MouseEvent, PointerEvent } from "react";
import { useRef } from "react";

/**
 * How long after a pointer press we ignore a click on the same key. Only has to
 * outlast the browser's synthetic-click delay, not a real gesture.
 */
const SYNTHETIC_CLICK_WINDOW_MS = 700;

interface KeyboardKeyProps {
  ariaLabel: string;
  assetUrl: string;
  disabled?: boolean;
  onPress: () => void;
}

/**
 * One key on either on-screen keyboard — the letters for decoding, the bits for
 * encoding.
 *
 * Presses land on pointerdown rather than click, the same rule the bit grid
 * follows (see BitButton and issue #186). Two reasons, and the second is the one
 * that bites: a key that answers on release feels late under fast entry, and a
 * `<button>` still running the browser's default gesture handling has its taps
 * evaluated as candidate double-taps, which arrive bunched rather than evenly
 * spaced. Entering a long run of the same bit — a Z in alpha-length is a dozen
 * of them — makes the beeps come in pairs.
 *
 * The CSS half of that fix is `touch-action: manipulation` on `.keyboard-key`,
 * which is where it belongs rather than on a container a caller might not use.
 *
 * Not to be confused with `useActivationGuard`, which solves the opposite
 * problem: that one waits for the click and drops it unless the gesture *began*
 * on the control, for buttons that appear underneath a finger already down.
 */
const KeyboardKey: FC<KeyboardKeyProps> = ({ ariaLabel, assetUrl, disabled = false, onPress }) => {
  const lastPointerPress = useRef(0);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    // Secondary buttons shouldn't type. Touch and pen both report 0.
    if (event.button !== 0) {
      return;
    }
    // Suppresses the compatibility click that a tap would otherwise synthesise,
    // and stops a key the player is only tapping from taking focus.
    event.preventDefault();
    lastPointerPress.current = performance.now();
    onPress();
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    // Keyboard activation reports detail === 0 and has no pointerdown to pair
    // with, so it is always honoured. Anything else this soon after our own
    // pointerdown is that gesture's trailing click, already dealt with.
    if (event.detail !== 0
      && performance.now() - lastPointerPress.current < SYNTHETIC_CLICK_WINDOW_MS) {
      return;
    }
    onPress();
  };

  return (
    <button
      type="button"
      className="keyboard-key"
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      // Long-press raises the context menu on Android and desktop, which
      // interrupts a run of fast entry.
      onContextMenu={event => event.preventDefault()}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <img
        src={assetUrl}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="keyboard-key-image"
      />
    </button>
  );
};

export { KeyboardKey };
export type { KeyboardKeyProps };
