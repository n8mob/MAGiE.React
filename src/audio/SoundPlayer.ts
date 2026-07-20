/**
 * A tiny Web Audio wrapper for short, latency-sensitive UI sounds.
 *
 * HTMLAudioElement is fine for one-shot fanfares but poor for taps: each play()
 * has real startup latency, and a single element can't overlap with itself, so
 * fast toggling either drops sounds or restarts them mid-tap. Instead we decode
 * each file once into an AudioBuffer and fire a fresh BufferSourceNode per hit,
 * which is cheap and overlaps cleanly.
 *
 * Autoplay policy is the tricky part. A context created outside a user gesture
 * starts suspended, and some browsers are reluctant to resume one that was born
 * that way. So we download bytes eagerly (the slow part) but hold off creating
 * the context until the first gesture, then decode.
 */

import { debug } from "../Logger.ts";

let context: AudioContext | null = null;
/** Downloaded but not yet decoded. Needs no AudioContext. */
const rawBytes = new Map<string, ArrayBuffer>();
/** Decoded and ready to play. */
const buffers = new Map<string, AudioBuffer>();
/** Decodes currently in flight, so we don't start the same one twice. */
const decoding = new Set<string>();
const fetches = new Map<string, Promise<void>>();

/**
 * Get the AudioContext, creating it if needed. Prefer calling this from inside
 * a user-gesture handler; a context born during a gesture starts running.
 */
function getContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!context) {
    const Ctor = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      debug("Web Audio is unavailable; sounds are disabled.");
      return null;
    }
    context = new Ctor();
    debug(`AudioContext created in state "${context.state}"`);
  }
  return context;
}

/**
 * Decode anything we have bytes for but haven't decoded yet.
 *
 * This creates the AudioContext if there isn't one, rather than waiting for a
 * gesture. Decoding at load time is what makes the first tap of the session
 * audible; a context that starts suspended is fine because primeAudio runs on
 * every gesture, not just the first.
 */
function decodePending(): void {
  const ctx = getContext();
  if (!ctx) {
    return;
  }
  for (const [url, bytes] of rawBytes) {
    // decodeAudioData is async, so buffers stays empty until it resolves. Track
    // in-flight decodes separately or every call here starts a duplicate.
    if (buffers.has(url) || decoding.has(url)) {
      continue;
    }
    decoding.add(url);
    // decodeAudioData detaches the ArrayBuffer, so hand it a copy and keep ours
    // in case a later context needs to decode again.
    ctx.decodeAudioData(bytes.slice(0))
      .then(buffer => {
        buffers.set(url, buffer);
        debug(`Decoded ${url} (${buffer.duration.toFixed(3)}s)`);
      })
      .catch(error => { console.warn(`Failed to decode ${url}:`, error); })
      .finally(() => { decoding.delete(url); });
  }
}

/**
 * Download a sound so it's ready to play later. Safe to call repeatedly with
 * the same url; the fetch happens once. Decoding waits for an AudioContext.
 */
function loadSound(url: string): Promise<void> {
  if (rawBytes.has(url)) {
    decodePending();
    return Promise.resolve();
  }
  const inFlight = fetches.get(url);
  if (inFlight) {
    return inFlight;
  }

  const request = fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.arrayBuffer();
    })
    .then(bytes => {
      rawBytes.set(url, bytes);
      debug(`Downloaded ${url} (${bytes.byteLength} bytes)`);
      decodePending();
    })
    .catch(error => { console.warn(`Failed to load sound ${url}:`, error); })
    .finally(() => { fetches.delete(url); });

  fetches.set(url, request);
  return request;
}

/**
 * Create/resume the AudioContext. Call from a user-gesture handler. Cheap and
 * idempotent, so it runs on every gesture rather than just the first: a single
 * failed resume should not leave the game silent for the rest of the session.
 */
function primeAudio(): void {
  const ctx = getContext();
  if (!ctx) {
    return;
  }
  if (ctx.state === "suspended") {
    ctx.resume()
      .then(() => { debug(`AudioContext resumed, now "${ctx.state}"`); })
      .catch(error => { debug("AudioContext resume failed:", error); });
  }
  decodePending();
}

if (typeof window !== "undefined") {
  const prime = () => { primeAudio(); };
  window.addEventListener("pointerdown", prime);
  window.addEventListener("keydown", prime);
}

/**
 * Play an already-downloaded sound. If it hasn't finished decoding this is a
 * no-op rather than a delayed play, since a late tap is worse than none.
 */
function playSound(url: string, volume = 0.25): void {
  const ctx = getContext();
  if (!ctx) {
    return;
  }
  // Never bail on a suspended context: nudge it and play anyway, so a sound
  // triggered by the very first gesture still lands.
  if (ctx.state === "suspended") {
    primeAudio();
  }

  const buffer = buffers.get(url);
  if (!buffer) {
    debug(`No decoded buffer for ${url} yet; skipping this play.`);
    void loadSound(url);
    return;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(gain).connect(ctx.destination);
  source.start();
}

export { loadSound, playSound, primeAudio };
