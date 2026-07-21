import { useEffect, useRef } from "react";
import { BitSequence } from "../BitSequence.ts";
import { loadSound, playSound } from "../audio/SoundPlayer.ts";
import { SOUNDS } from "../audio/sounds.ts";
import { diffBitSounds } from "../audio/bitSoundDiff.ts";

const DEFAULT_ON_SOUND = SOUNDS.bitOn;
const DEFAULT_OFF_SOUND = SOUNDS.bitOff;

interface BitSoundOptions {
  onSound?: string;
  offSound?: string;
  volume?: number;
  enabled?: boolean;
}

/**
 * Plays a tap whenever bits change, regardless of how they changed: clicking a
 * BitButton, the on-screen bit inputs, or the keyboard all land here, because
 * they all end up rewriting the same BitSequence.
 *
 * Diffing the sequence rather than hooking each input also means an appended
 * bit sounds just like a toggled one, which is what encode levels want.
 *
 * The very first sequence is treated as the baseline, so a puzzle that loads
 * with bits already placed (chocolate mode) doesn't fire a chord on mount.
 */
function useBitSounds(bits: BitSequence, options: BitSoundOptions = {}): void {
  const {
    onSound = DEFAULT_ON_SOUND,
    offSound = DEFAULT_OFF_SOUND,
    volume = 0.25,
    enabled = true,
  } = options;

  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {return;}
    void loadSound(onSound);
    void loadSound(offSound);
  }, [enabled, onSound, offSound]);

  useEffect(() => {
    if (!enabled) {return;}

    const current = bits.toPlainString();
    const before = previous.current;
    previous.current = current;

    if (before === null) {return;}

    const direction = diffBitSounds(before, current);
    if (direction === "on") {playSound(onSound, volume);}
    else if (direction === "off") {playSound(offSound, volume);}
  }, [bits, enabled, onSound, offSound, volume]);
}

export { useBitSounds, DEFAULT_ON_SOUND, DEFAULT_OFF_SOUND };
export type { BitSoundOptions };
