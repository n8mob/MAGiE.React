import { FC, ReactNode, useCallback, useState } from "react";
import { ChannelStrip, CHANNEL_LABEL, ChannelId, OTHER } from "./ChannelStrip.tsx";
import { Puzzle } from "../model.ts";
import "./DualChannel.css";

/**
 * A puzzle split across the two channels.
 *
 * CH 1 carries everything the Administrator says in words: the clue going in,
 * and the whole win transcript coming out. CH 2 is the MAGiE device, which is
 * the existing Encode/Decode mode rendered with `textElsewhere` so it draws only
 * the machine. Neither the mode nor the route knows about channels; this shell
 * owns the split.
 *
 * The loop the fiction wants is: read the instruction in plain text, tune down
 * to the bits to act on it, and come back up to be told what you did. So play
 * opens on CH 1 with CH 2 blinking, and a win tunes back to CH 1 on its own.
 * That win transcript replaces the WinScreen overlay — "admire puzzle" is no
 * longer a button, it is tapping the CH 2 strip.
 *
 * **The hidden channel is hidden, not unmounted.** Unmounting the mode would
 * throw away the player's guess every time they looked at the clue. It is
 * pulled out of flow and made `visibility: hidden` instead, which keeps a real
 * layout box — `useBasePuzzle` measures the bit field to decide how many bits
 * fit a row, and `display: none` would measure zero.
 */
interface DualChannelPlayProps {
  puzzle: Puzzle;
  /** The mode has reported a win, so CH 1 switches from clue to transcript. */
  won: boolean;
  /**
   * Auto-win puzzles (the tutorial's demo screens) open already solved and teach
   * by pointing at the bits. Yanking those to CH 1 on arrival would hide the
   * very thing being demonstrated, so they stay put and the transcript waits.
   */
  isAutoWin?: boolean;
  /** One line of CH 2 for the strip. Never the answer to an Encode puzzle. */
  signalPreview: string;
  /** Where the player can go next, from the route. Lands under the transcript. */
  winActions?: ReactNode;
  /** The puzzle mode, rendered with `textElsewhere`. */
  children: ReactNode;
}

const DualChannelPlay: FC<DualChannelPlayProps> = (
  { puzzle, won, isAutoWin = false, signalPreview, winActions, children }
) => {
  // Open on the instruction, not the machine: the clue is what sends the player
  // down to the bits in the first place.
  const [tuned, setTuned] = useState<ChannelId>("admin");
  const [heardSignal, setHeardSignal] = useState(false);
  const [heardWin, setHeardWin] = useState(false);

  const tune = useCallback((channel: ChannelId) => {
    setTuned(channel);
    if (channel === "signal") {
      setHeardSignal(true);
    } else if (won) {
      setHeardWin(true);
    }
  }, [won]);

  /*
   * Tune back to CH 1 the moment the win lands, so the Administrator's reply is
   * where a win screen used to be. Adjusted during render rather than in an
   * effect — the same way WinScreen clears its own dismissal — so the channel
   * is already right in the render that first sees `won`, not a commit later.
   */
  const [renderedWon, setRenderedWon] = useState(won);
  if (won !== renderedWon) {
    setRenderedWon(won);
    if (won && !isAutoWin) {
      setTuned("admin");
      setHeardWin(true);
    }
  }

  const stripped = OTHER[tuned];
  // CH 2 nags until the player has been there once — it is where the game is.
  // CH 1 nags only when it is holding a win the player has not come back for.
  const unread = stripped === "signal" ? !heardSignal : won && !heardWin;

  const cluePreview = puzzle.clue?.[0] ?? "";
  const preview = stripped === "signal"
    ? signalPreview
    : (won ? puzzle.winText : cluePreview);

  const strip = (
    <ChannelStrip channel={stripped} preview={preview} unread={unread} onTune={tune} />
  );

  return (
    <div className={`dual-channel-play tuned-${tuned}`}>
      {/* Text keeps the top edge, bits the bottom, whichever one is tuned. */}
      {tuned === "signal" && strip}

      <div
        className={`channel-pane channel-pane-admin${tuned === "admin" ? "" : " channel-pane-hidden"}`}
        aria-hidden={tuned !== "admin"}
      >
        <div className="channel-text display">
          <p className="channel-heading">{CHANNEL_LABEL.admin}</p>
          {(puzzle.clue ?? []).map((clueLine, clueIndex) => (
            <p key={`clue-${clueIndex}`}>{clueLine}</p>
          ))}
          {/* The same transcript WinScreen renders — clue, then what the player
              answered, then what the Administrator said back — except it is not
              an overlay any more, it is simply the other channel. */}
          {won && <p className="win-screen-answer">{puzzle.winText}</p>}
          {won && (puzzle.winMessage ?? []).map((winLine, winIndex) => (
            <p key={`win-${winIndex}`}>{winLine}</p>
          ))}
        </div>
        {won && winActions && <div className="channel-actions">{winActions}</div>}
      </div>

      <div
        className={`channel-pane channel-pane-signal${tuned === "signal" ? "" : " channel-pane-hidden"}`}
        aria-hidden={tuned !== "signal"}
      >
        {children}
      </div>

      {tuned === "admin" && strip}
    </div>
  );
};

export { DualChannelPlay };
