export function getOrCreateSessionChallenge(): string {
  const key = 'featureChallenge';
  let challenge = sessionStorage.getItem(key);
  if (!challenge) {
    // Use 16-bit challenge for simplicity (4 hex chars)
    challenge = crypto.getRandomValues(new Uint8Array(2))
      .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
    sessionStorage.setItem(key, challenge);
    console.log("Session challenge:", challenge);
  }
  return challenge;
}
