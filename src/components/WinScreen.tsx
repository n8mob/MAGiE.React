import { FC, ReactNode, SyntheticEvent, useEffect, useRef } from "react";
import { useActivationGuard } from "../hooks/useActivationGuard.ts";
import "./WinScreen.css";

/**
 * The win experience: a screen in look and feel, an overlay in fact.
 *
 * Daily-puzzle games almost never fold the win into the board — it arrives as
 * its own surface, with a way back to admire what you solved. This is that
 * surface, but it stays an overlay rather than a route because the win state is
 * derived and short-lived: score, strikes, the solved bits. Sending that across
 * a navigation would mean either a store or a reload that has nothing to show.
 * Left mounted underneath, the puzzle is simply still there, scroll position and
 * all, and "admire puzzle" costs nothing to implement.
 *
 * What varies by mode goes in through slots rather than props: `stats` for
 * whatever the mode scored, `actions` for wherever the route can go next.
 */
interface WinScreenProps {
  open: boolean;
  /** The puzzle's own win text, one line per array entry. */
  winMessage: string[];
  /** Step aside and leave the finished puzzle on screen. */
  onDismiss: () => void;
  /** Mode-specific scoring — Chocolate's SCORE and LETTERS GLEANED. */
  stats?: ReactNode;
  /** Where to go from here. Supplied by whichever route loaded the puzzle. */
  actions?: ReactNode;
}

const WinScreen: FC<WinScreenProps> = ({ open, winMessage, onDismiss, stats, actions }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  /*
   * showModal() rather than an `open` attribute, because it puts the screen in
   * the browser's top layer — which is the whole reason this is a <dialog> and
   * not a div. Dessert's belt lives inside an overflow-hidden, position-relative
   * box under a sticky HUD; a plain overlay would have to out-stack all of that
   * from outside. The top layer is above it by definition. Focus containment,
   * Esc, and an inert background come along with it.
   */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    // jsdom ships <dialog> without the modal methods, and so do older browsers.
    // Falling back to the open attribute gives up the top layer and the focus
    // trap, but still shows and hides the thing.
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [open]);

  // A <dialog> closes itself on Esc. Route that back through React instead, so
  // `open` can never disagree with what is actually on screen.
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onDismiss();
  };

  // This screen arrives on the very gesture that won the puzzle, so its button
  // can materialise under a finger that was still on a bit. Same guard the
  // after-win controls have carried since #233.
  const dismissControl = useActivationGuard<HTMLButtonElement>(onDismiss);

  return (
    <dialog ref={dialogRef} className="win-screen" onCancel={handleCancel}>
      <div className="win-screen-frame display-frame">
        <div className="win-screen-panel display">
          {stats && <div className="win-screen-stats">{stats}</div>}
          {winMessage.map((winLine, winIndex) => (
            <p key={`win-message-${winIndex}`}>{winLine}</p>
          ))}
        </div>
        <div className="win-screen-controls">
          {actions}
          <button type="button" className="win-screen-dismiss" {...dismissControl}>
            Admire puzzle
          </button>
        </div>
      </div>
    </dialog>
  );
};

export { WinScreen };
export type { WinScreenProps };
