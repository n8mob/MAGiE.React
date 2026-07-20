/**
 * Decide which tap (if any) a bit-string change should make.
 *
 * Pulled out of useBitSounds so the rule is testable without a browser or an
 * AudioContext. Note that an unguessed bit stringifies as " ", so a bit going
 * from blank to "1" counts as turning on.
 */
type BitSoundDirection = "on" | "off" | null;

function diffBitSounds(before: string, current: string): BitSoundDirection {
  if (before === current) {
    return null;
  }

  let turnedOn = false;
  let turnedOff = false;

  const shared = Math.min(before.length, current.length);
  for (let i = 0; i < shared; i++) {
    if (before[i] === current[i]) {
      continue;
    }
    if (current[i] === "1") {
      turnedOn = true;
    } else {
      turnedOff = true;
    }
  }

  // Bits appended past the old end: a new "1" is an on-tap, anything else off.
  for (let i = shared; i < current.length; i++) {
    if (current[i] === "1") {
      turnedOn = true;
    } else {
      turnedOff = true;
    }
  }

  // Backspacing shortens the sequence, which always reads as an off-tap.
  if (current.length < before.length) {
    turnedOff = true;
  }

  if (turnedOn) {
    return "on";
  }
  return turnedOff ? "off" : null;
}

export { diffBitSounds };
export type { BitSoundDirection };
