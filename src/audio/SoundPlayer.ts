/**
 * A tiny Web Audio wrapper for short, latency-sensitive UI sounds.
 *
 * HTMLAudioElement is fine for one-shot fanfares but poor for taps: each play()
 * has real startup latency, and a single element can't overlap with itself, so
 * fast toggling either drops sounds or restarts them mid-tap. Instead we decode
 * each file once into an AudioBuffer and fire a fresh BufferSourceNode per hit,
 * which is cheap and overlaps cleanly.
 *
 * Browsers start the AudioContext suspended until a user gesture, so the first
 * real interaction resumes it (see primeAudio).
 */

let context: AudioContext | null = null;
const buffers = new Map<string, AudioBuffer>();
const pending = new Map<string, Promise<AudioBuffer | null>>();

function getContext(): AudioContext | null {
  if (typeof window === "undefined") {return null;}
  if (!context) {
    const Ctor = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {return null;}
    context = new Ctor();
  }
  return context;
}

/**
 * Fetch and decode a sound so it's ready to play instantly later.
 * Safe to call repeatedly with the same url; the work happens once.
 */
function loadSound(url: string): Promise<AudioBuffer | null> {
  if (buffers.has(url)) {return Promise.resolve(buffers.get(url)!);}
  const inFlight = pending.get(url);
  if (inFlight) {return inFlight;}

  const ctx = getContext();
  if (!ctx) {return Promise.resolve(null);}

  const request = fetch(url)
    .then(response => response.arrayBuffer())
    .then(data => ctx.decodeAudioData(data))
    .then(buffer => {
      buffers.set(url, buffer);
      return buffer;
    })
    .catch(error => {
      console.warn(`Failed to load sound ${url}:`, error);
      return null;
    })
    .finally(() => { pending.delete(url); });

  pending.set(url, request);
  return request;
}

/**
 * Resume the AudioContext. Must be called from inside a user-gesture handler
 * or the first sound of the session will be silently dropped.
 */
function primeAudio(): void {
  const ctx = getContext();
  if (ctx?.state === "suspended") {
    ctx.resume().catch(() => { /* nothing useful to do; sounds stay silent */ });
  }
}

/**
 * Play a preloaded sound. If it hasn't finished decoding yet this is a no-op
 * rather than a delayed play, since a late tap sound is worse than none.
 */
function playSound(url: string, volume = 0.25): void {
  const ctx = getContext();
  const buffer = buffers.get(url);
  if (!ctx || !buffer) {
    if (!buffer) {void loadSound(url);}
    return;
  }
  if (ctx.state === "suspended") {return;}

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(gain).connect(ctx.destination);
  source.start();
}

export { loadSound, playSound, primeAudio };
