import { MouseEvent, useRef } from "react";

/**
 * Guards a control that appears in response to a pointer event which landed
 * somewhere else.
 *
 * Bits toggle on pointerdown rather than click (see BitButton, issue #186), so
 * the winning tap re-renders the DOM while the player's finger is still down.
 * The click that follows is hit-tested against the *new* layout — and on touch
 * the browser synthesises that click at the touch point after touchend — so it
 * lands on whatever now occupies the spot. Which is usually the [Next ▶▶] button
 * that just appeared under the finger, skipping the win message entirely.
 *
 * The guard is simply: only honour an activation that began on this control. It
 * arms on its own pointerdown, so a click arriving unarmed is somebody else's
 * gesture finishing. Keyboard activation reports `detail === 0` and is always
 * honoured, since it has no pointerdown to match.
 *
 * Preferred over delaying the control by a few hundred milliseconds: no
 * arbitrary constant, no dead window for a player who really is that quick, and
 * it doesn't depend on which event path delivers the stray click.
 */
export function useActivationGuard<E extends Element>(
  onActivate: (event: MouseEvent<E>) => void
) {
  const armed = useRef(false);

  return {
    onPointerDown: () => {
      armed.current = true;
    },
    // A cancelled pointer produces no click of its own, so disarm — otherwise a
    // stray click could ride in on it later.
    onPointerCancel: () => {
      armed.current = false;
    },
    onClick: (event: MouseEvent<E>) => {
      if (event.detail !== 0 && !armed.current) {
        // Matters for <Link>: without this react-router still navigates, even
        // though the handler declined to run.
        event.preventDefault();
        return;
      }
      armed.current = false;
      onActivate(event);
    },
  };
}
