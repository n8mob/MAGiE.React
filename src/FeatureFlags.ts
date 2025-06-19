import { importSPKI, jwtVerify } from 'jose';
import { getOrCreateSessionChallenge } from "./SessionChallenge.ts";

// noinspection SpellCheckingInspection
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzCalU2ld52jM7jkvy7g4
R/i4PidTFv3pVwd91pjLiU/rc4Uuc1aAa6H/qkZnwdJr7yvbjPooanWACAbuObZO
ctQOxoBeIgU2QE2NIrESa+/hE0MEzyE+RvEmFwDOt30aAB+W5St5xyUeFajy18jj
KGcWr6WvuYIqtTuNy5B2HkWPkjebM7JmM3VVq90hyXFfwZUnQTSPrVwbT05e/W7B
wlXVDwKo2aNNJQYRoZmdQXpVV86J2wfYeyx63xV8xrKVOr568pZP9EA7+OUowFDQ
pvLLxSY85ynvCs7Bd/kxabKWaEP3+lMmntnqmoR2oysu84KxJz1+UzJhYTC7j3Fs
6QIDAQAB
-----END PUBLIC KEY-----`;

export async function getFeatureFlagsFromURL(): Promise<string[]> {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('features');

  if (!token) {
    console.warn("No 'features' token found in URL");
    return [];
  }

  const challenge = getOrCreateSessionChallenge();

  try {
    const publicKey = await importSPKI(PUBLIC_KEY, 'RS256');
    const { payload } = await jwtVerify(token, publicKey);
    console.log(payload);
    if (payload.challenge !== challenge) {
      console.warn("Challenge mismatch");
      return [];
    }

    return Array.isArray(payload.features) ? payload.features : [];
  } catch (err) {
    console.warn("There was a problem verifying the JWT", err);
    return [];
  }
}
