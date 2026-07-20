import { useEffect, useRef } from "react";
import { BitSequence } from "../BitSequence.ts";
import { loadSound, playSound } from "../audio/SoundPlayer.ts";
import { SOUNDS } from "../audio/sounds.ts";

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

    if (before === null || before === current) {return;}

    // A change is "on" if any bit went 0 -> 1, or if the sequence grew with a
    // 1 on the end. Everything else reads as an "off" tap.
    let turnedOn = false;
    let turnedOff = false;
    const shared = Math.min(before.length, current.length);
    for (let i = 0; i < shared; i++) {
      if (before[i] === current[i]) {continue;}
      if (current[i] === "1") {turnedOn = true;}
      else {turnedOff = true;}
    }
    for (let i = shared; i < current.length; i++) {
      if (current[i] === "1") {turnedOn = true;}
      else {turnedOff = true;}
    }
    if (current.length < before.length) {turnedOff = true;}

    if (turnedOn) {playSound(onSound, volume);}
    else if (turnedOff) {playSound(offSound, volume);}
  }, [bits, enabled, onSound, offSound, volume]);
}

export { useBitSounds, DEFAULT_ON_SOUND, DEFAULT_OFF_SOUND };
export type { BitSoundOptions };
