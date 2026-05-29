#!/usr/bin/env python3
"""
Sign a MAGiE feature-flags JWT.

Usage:
    python3 scripts/sign_features.py <private_key.pem> <challenge> [feature1 feature2 ...]

Example:
    python3 scripts/sign_features.py ~/magie_private.pem a3f1 tutorial story doorLock

The output token can be appended to any route as ?features=<token>.
"""

import sys
import json
import base64
from datetime import datetime, timezone, timedelta
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def make_jwt(private_key_path: str, challenge: str, features: list[str]) -> str:
    with open(private_key_path, 'rb') as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)

    header = b64url(json.dumps({"alg": "RS256", "typ": "JWT"}).encode())

    now = datetime.now(timezone.utc)
    payload_data = {
        "challenge": challenge,
        "features": features,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=24)).timestamp()),
    }
    payload = b64url(json.dumps(payload_data).encode())

    signing_input = f"{header}.{payload}".encode()
    signature = private_key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())

    return f"{header}.{payload}.{b64url(signature)}"


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    key_path = sys.argv[1]
    challenge = sys.argv[2]
    features = sys.argv[3:] if len(sys.argv) > 3 else ["tutorial"]

    token = make_jwt(key_path, challenge, features)
    print(token)
