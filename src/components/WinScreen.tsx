import { FC, ReactNode, SyntheticEvent, useEffect, useRef, useState } from "react";
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
  /** The run is over and won, so the screen is on offer. */
  won: boolean;
  /**
   * The puzzle's clue, one line per array entry — the opening of the transcript.
   *
   * Most win messages were written as the second half of a sentence the clue
   * begins and the answer completes ("LATER YOU WILL ENCODE" / "HOMEWORK" /
   * "BUT FOR NOW, JUST COMPLETE THE LESSONS"), or as a reply to the answer
   * ("ENCODING IS FUN!" / "IT SURE IS!"). Showing the message alone strands it.
   */
  clue: string[];
  /**
   * The answer, between the clue and the message.
   *
   * A ReactNode rather than a string because Chocolate shows what the player
   * actually gleaned, letter by letter, rather than what was on the card.
   */
  answer: ReactNode;
  /** The puzzle's own win text, one line per array entry. */
  winMessage: string[];
  /** Mode-specific scoring — Chocolate's SCORE and LETTERS GLEANED. */
  stats?: ReactNode;
  /** Where to go from here. Supplied by whichever route loaded the puzzle. */
  actions?: ReactNode;
}

const WinScreen: FC<WinScreenProps> = ({ won, clue, answer, winMessage, stats, actions }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  /*
   * Showing and hiding is this component's own business, not the caller's. A
   * mode says only that the puzzle is won; when the screen is up, whether it has
   * been stepped aside, and how to get it back are all one behaviour, and every
   * mode that adopts this would otherwise have to rebuild it.
   */
  const [dismissed, setDismissed] = useState(false);

  /*
   * A fresh run puts the screen back on offer. Cleared during render rather
   * than in an effect, the same way the routes clear their per-puzzle state:
   * it has to be right in the render where `won` goes false, not a commit later.
   */
  const [renderedWon, setRenderedWon] = useState(won);
  if (won !== renderedWon) {
    setRenderedWon(won);
    if (!won) {
      setDismissed(false);
    }
  }

  const open = won && !dismissed;

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
    setDismissed(true);
  };

  // This screen arrives on the very gesture that won the puzzle, so its button
  // can materialise under a finger that was still on a bit. Same guard the
  // after-win controls have carried since #233.
  const dismissControl = useActivationGuard<HTMLButtonElement>(() => setDismissed(true));
  const recallControl = useActivationGuard<HTMLButtonElement>(() => setDismissed(false));

  return (
    <>
      <dialog ref={dialogRef} className="win-screen" onCancel={handleCancel}>
        <div className="win-screen-frame display-frame">
          {/* One transcript, in the order it was spoken: what the puzzle asked,
              what the player answered, what it said back. The panel scrolls,
              which only actually matters for the dozen or so puzzles whose three
              parts run past a screenful. */}
          <div className="win-screen-panel display">
            {stats && <div className="win-screen-stats">{stats}</div>}
            {clue.map((clueLine, clueIndex) => (
              <p key={`win-clue-${clueIndex}`}>{clueLine}</p>
            ))}
            <p className="win-screen-answer">{answer}</p>
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
      {/* Admiring the puzzle has to be a round trip. Everything that moves the
          player on from here lives on the screen, so stepping it aside without
          a way back would strand them on a finished puzzle. */}
      {won && dismissed && (
        <div className="after-win-controls win-screen-recall">
          <button type="button" {...recallControl}>Win screen ▲</button>
        </div>
      )}
    </>
  );
};

export { WinScreen };
export type { WinScreenProps };
