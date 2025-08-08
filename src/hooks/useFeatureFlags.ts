import { importSPKI, jwtVerify } from 'jose';
import { useEffect, useState } from "react";
import { debug } from "../Logger.ts";

// noinspection SpellCheckingInspection
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzCalU2ld52jM7jkvy7g4
R/i4PidTFv3pVwd91pjLiU/rc4Uuc1aAa6H/qkZnwdJr7yvbjPooanWACAbuObZO
ctQOxoBeIgU2QE2NIrESa+/hE0MEzyE+RvEmFwDOt30aAB+W5St5xyUeFajy18jj
KGcWr6WvuYIqtTuNy5B2HkWPkjebM7JmM3VVq90hyXFfwZUnQTSPrVwbT05e/W7B
wlXVDwKo2aNNJQYRoZmdQXpVV86J2wfYeyx63xV8xrKVOr568pZP9EA7+OUowFDQ
pvLLxSY85ynvCs7Bd/kxabKWaEP3+lMmntnqmoR2oysu84KxJz1+UzJhYTC7j3Fs
6QIDAQAB
-----END PUBLIC KEY-----`;

function getOrCreateSessionChallenge(): string {
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

export function useFeatureFlags() {
  const NORMAL_FEATURES = ['tutorial'];
  const [features, setFeatures] = useState<string[]>(NORMAL_FEATURES);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('features');
    if (!token) {
      debug('No feature flags token found, returning default flags.');
      return;
    }

    const challenge = getOrCreateSessionChallenge();

    (async () => {
      try {
        const publicKey = await importSPKI(PUBLIC_KEY_PEM, 'RS256');
        const {payload} = await jwtVerify(token, publicKey);

        if (challenge !== payload.challenge) {
          console.warn("Feature flags challenge does not match, ignoring token.");
          setFeatures([]);
          return;
        }

        if (Array.isArray(payload.features)) {
          setFeatures(payload.features as string[]);
        } else {
          setFeatures([]);
        }
      } catch (error) {
        console.warn("There was a problem verifying the JWT", error);
        setFeatures([]);
      }
    })();
  }, []);


  return features;
}
