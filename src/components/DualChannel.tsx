import { useCallback, useMemo, useState } from "react";
import { BitButton } from "./BitButton.tsx";
import { DisplayMatrix } from "./DisplayMatrix.tsx";
import { fiveBitA1 } from "../encoding/FiveBitA1.ts";
import { TRANSMISSIONS } from "../dualChannel/transmissions.ts";
import { usePageTitle } from "../hooks/usePageTitle.ts";
import { dualChannelTitle } from "../pageTitles.ts";
import "./DualChannel.css";

/**
 * Two communications channels, one screen.
 *
 * The Administrator broadcasts in the clear on CH 1 and in binary on CH 2, and
 * the player can only be tuned to one of them. The other is not gone, though:
 * it stays on screen as a strip at the edge — too small to read, big enough to
 * show that something is happening over there. That strip is the whole feature.
 * It is the only thing telling a new player the second channel exists, and
 * tapping it is the act of curiosity the fiction is testing for.
 *
 * Each channel keeps its own edge: text lives at the top, bits at the bottom,
 * whichever one you are tuned to. Tuning never moves a channel across the
 * screen, so the gesture stays the same one every time.
 */

type ChannelId = "admin" | "signal";

const CHANNEL_LABEL: Record<ChannelId, string> = {
  admin: "CH 1 · MALL PA",
  // Unlabelled on purpose: the mall's directory does not admit this one exists.
  signal: "CH 2 · · · · · ·",
};

/**
 * What the strip calls a channel. Shorter than the heading, because the strip's
 * job is to show the other channel's *content* — a wide label would crowd out
 * the very thing that proves something is happening over there.
 */
const CHANNEL_TAG: Record<ChannelId, string> = { admin: "CH 1", signal: "CH 2" };

const OTHER: Record<ChannelId, ChannelId> = { admin: "signal", signal: "admin" };

/**
 * The built-in 5bA1 — the encoding the tutorial teaches and Chocolate falls back
 * to — so this route needs no menu data and works with the puzzle API offline.
 */
const SECRET_ENCODER = fiveBitA1;

/** Bits shown in the CH 2 strip. Enough to look alive, too few to read. */
const STRIP_BIT_COUNT = 24;

const DualChannel = () => {
  usePageTitle(dualChannelTitle());

  const [tuned, setTuned] = useState<ChannelId>("admin");
  const [index, setIndex] = useState(0);
  /**
   * The last transmission each channel has been tuned to. A channel is unread
   * when it has fallen behind the broadcast, which is what makes its strip
   * blink. CH 2 starts behind on purpose — the first unread marker is the only
   * invitation a first-time player gets.
   */
  const [lastHeard, setLastHeard] = useState<Record<ChannelId, number>>({ admin: 0, signal: -1 });
  const [showDecoder, setShowDecoder] = useState(false);

  const transmission = TRANSMISSIONS[index];
  const isLast = index === TRANSMISSIONS.length - 1;

  const secretBits = useMemo(
    () => SECRET_ENCODER.encodeText(transmission.secret),
    [transmission.secret],
  );

  /** One character per row, the way Chocolate mode shows a message. */
  const secretRows = useMemo(
    () => [...SECRET_ENCODER.splitForDisplay(secretBits, 5)],
    [secretBits],
  );

  const tune = useCallback((channel: ChannelId) => {
    setTuned(channel);
    setLastHeard(heard => ({ ...heard, [channel]: index }));
  }, [index]);

  const advance = useCallback(() => {
    if (isLast) {
      return;
    }
    const next = index + 1;
    setIndex(next);
    // Only the channel you are actually watching counts as heard.
    setLastHeard(heard => ({ ...heard, [tuned]: next }));
  }, [index, isLast, tuned]);

  const strippedChannel = OTHER[tuned];
  const isUnread = lastHeard[strippedChannel] < index;

  const stripPreview = strippedChannel === "admin"
    ? transmission.announcement[0]
    : secretBits.toPlainString().slice(0, STRIP_BIT_COUNT);

  const strip = (
    <button
      type="button"
      className={`channel-strip channel-strip-${strippedChannel}${isUnread ? " unread" : ""}`}
      onClick={() => tune(strippedChannel)}
      aria-label={`Tune to ${CHANNEL_LABEL[strippedChannel]}${isUnread ? ", new transmission waiting" : ""}`}
    >
      <span className="channel-strip-label">{CHANNEL_TAG[strippedChannel]}</span>
      <span className="channel-strip-preview">{stripPreview}</span>
      <span className="channel-strip-indicator" aria-hidden="true">{isUnread ? "▌" : ""}</span>
    </button>
  );

  return (
    <div id="game-content" className={`dual-channel tuned-${tuned}`}>
      {/* The text channel's home edge is the top, so its strip sits above. */}
      {tuned === "signal" && strip}

      <div id="main-display" className="display">
        <p className="channel-heading">{CHANNEL_LABEL[tuned]}</p>

        {tuned === "admin"
          ? (
            <div id="clue-text">
              {transmission.announcement.map((line, lineIndex) => <p key={lineIndex}>{line}</p>)}
            </div>
          )
          : (
            <DisplayMatrix
              displayRows={secretRows}
              showAnnotations={showDecoder}
              renderBit={bit => <BitButton key={`bit-${bit.index}`} bit={bit} />}
            />
          )}
      </div>

      <div id="puzzle-inputs">
        {tuned === "admin"
          ? (
            <button type="button" onClick={advance} disabled={isLast}>
              {isLast ? "End of broadcast" : "Next ▶▶"}
            </button>
          )
          : (
            /* Scaffolding, not a shipped feature: without a guessing loop this
               is the only way to check that the bits say what they should. */
            <button type="button" onClick={() => setShowDecoder(show => !show)}>
              {showDecoder ? "Decoder ▾" : "Decoder ▸"}
            </button>
          )}
      </div>

      {/* The binary channel's home edge is the bottom. */}
      {tuned === "admin" && strip}
    </div>
  );
};

export { DualChannel };
