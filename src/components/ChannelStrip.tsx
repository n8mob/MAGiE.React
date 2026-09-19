import { FC } from "react";

/**
 * The two communications channels, and the sliver of one you can see while
 * tuned to the other.
 *
 * CH 1 is the Administrator in the clear — clues, instructions, the win
 * transcript. CH 2 is the MAGiE device itself, where everything is bits. The
 * player is tuned to exactly one at a time, and the strip is the only thing on
 * screen saying the other exists. Tapping it is the switch; there is no other
 * control, so the strip has to teach itself: an in-fiction tag rather than UI
 * chrome, and a blink whenever its channel holds something unseen.
 */
type ChannelId = "admin" | "signal";

/** Long form, for the heading above a tuned channel. */
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

interface ChannelStripProps {
  /** The channel being bled through — the one you are *not* tuned to. */
  channel: ChannelId;
  /** One line of that channel's content, clipped by CSS to whatever fits. */
  preview: string;
  /** That channel holds something the player has not seen. Drives the blink. */
  unread: boolean;
  onTune: (channel: ChannelId) => void;
}

const ChannelStrip: FC<ChannelStripProps> = ({ channel, preview, unread, onTune }) => (
  <button
    type="button"
    className={`channel-strip channel-strip-${channel}${unread ? " unread" : ""}`}
    onClick={() => onTune(channel)}
    aria-label={`Tune to ${CHANNEL_LABEL[channel]}${unread ? ", new transmission waiting" : ""}`}
  >
    <span className="channel-strip-label">{CHANNEL_TAG[channel]}</span>
    <span className="channel-strip-preview">{preview}</span>
    <span className="channel-strip-indicator" aria-hidden="true">{unread ? "▌" : ""}</span>
  </button>
);

export { ChannelStrip, CHANNEL_LABEL, CHANNEL_TAG, OTHER };
export type { ChannelId };
