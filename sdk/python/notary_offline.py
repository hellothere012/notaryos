"""
NotaryOS Offline Verification - Ed25519 signature verification via JWKS.

Enables offline verification of Notary receipts without calling the API.
Fetches the JWKS public keys from the server, then verifies locally.

Requires the `cryptography` library:
    pip install cryptography

Usage:
    from notary_sdk import NotaryClient
    from notary_offline import OfflineVerifier

    verifier = OfflineVerifier.from_jwks("https://api.agenttownsquare.com")
    result = verifier.verify(receipt)
    print(result.valid)  # True/False
"""

__version__ = "2.0.0"

import base64
import hashlib
import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from urllib.request import Request, urlopen


@dataclass
class OfflineVerificationResult:
    """Result of offline receipt verification."""

    valid: bool
    signature_ok: bool
    structure_ok: bool
    reason: str
    key_id: str


class OfflineVerifier:
    """
    Verifies Notary receipts offline using Ed25519 public keys from JWKS.

    The verifier fetches the JWKS key set once, caches it, and then
    performs all verifications locally using the `cryptography` library.
    """

    def __init__(self, keys: Dict[str, bytes]) -> None:
        """
        Initialize with a mapping of kid -> raw Ed25519 public key bytes.

        Use the class methods from_jwks() or from_pem() instead of calling
        this constructor directly.
        """
        self._keys = keys  # kid -> 32-byte raw Ed25519 public key

    @classmethod
    def from_jwks(cls, base_url: str = "https://api.agenttownsquare.com") -> "OfflineVerifier":
        """
        Create an OfflineVerifier by fetching JWKS from the server.

        Args:
            base_url: API base URL

        Returns:
            OfflineVerifier with cached public keys
        """
        url = f"{base_url.rstrip('/')}/.well-known/jwks.json"
        req = Request(url, method="GET")
        req.add_header("Accept", "application/json")

        with urlopen(req, timeout=30) as resp:
            jwks = json.loads(resp.read().decode("utf-8"))

        keys: Dict[str, bytes] = {}
        for jwk in jwks.get("keys", []):
            if jwk.get("kty") != "OKP" or jwk.get("crv") != "Ed25519":
                continue
            kid = jwk.get("kid", "")
            x = jwk.get("x", "")
            if kid and x:
                # Decode base64url-encoded public key
                padding = 4 - len(x) % 4
                if padding != 4:
                    x += "=" * padding
                raw_key = base64.urlsafe_b64decode(x)
                keys[kid] = raw_key

        if not keys:
            raise ValueError("No Ed25519 keys found in JWKS response")

        return cls(keys)

    @classmethod
    def from_pem(cls, pem_data: str, kid: str = "default") -> "OfflineVerifier":
        """
        Create an OfflineVerifier from a PEM-encoded Ed25519 public key.

        Args:
            pem_data: PEM-encoded public key
            kid: Key ID to associate with this key

        Returns:
            OfflineVerifier with the provided key
        """
        try:
            from cryptography.hazmat.primitives.serialization import load_pem_public_key
        except ImportError:
            raise ImportError(
                "The 'cryptography' package is required for PEM key loading. "
                "Install with: pip install cryptography"
            )

        public_key = load_pem_public_key(pem_data.encode("utf-8"))
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

        if not isinstance(public_key, Ed25519PublicKey):
            raise ValueError("Key is not an Ed25519 public key")

        # Get the raw 32-byte key
        from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

        raw = public_key.public_bytes(Encoding.Raw, PublicFormat.Raw)
        return cls({kid: raw})

    def verify(self, receipt: Dict[str, Any]) -> OfflineVerificationResult:
        """
        Verify a receipt's signature offline using cached Ed25519 keys.

        Args:
            receipt: Receipt dict (must contain signature, key_id/kid, and
                     the fields needed to reconstruct the canonical message)

        Returns:
            OfflineVerificationResult
        """
        try:
            from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        except ImportError:
            raise ImportError(
                "The 'cryptography' package is required for offline verification. "
                "Install with: pip install cryptography"
            )

        # Check structure
        required_fields = ["receipt_id", "timestamp", "agent_id", "action_type",
                          "payload_hash", "signature", "signature_type"]
        missing = [f for f in required_fields if not receipt.get(f)]
        if missing:
            return OfflineVerificationResult(
                valid=False,
                signature_ok=False,
                structure_ok=False,
                reason=f"Missing required fields: {', '.join(missing)}",
                key_id="",
            )

        # Find the key
        kid = receipt.get("kid") or receipt.get("key_id", "")
        raw_key = self._keys.get(kid)

        if not raw_key:
            # Try matching by prefix (some systems use truncated kids)
            for stored_kid, stored_key in self._keys.items():
                if stored_kid.startswith(kid[:8]) or kid.startswith(stored_kid[:8]):
                    raw_key = stored_key
                    kid = stored_kid
                    break

        if not raw_key:
            return OfflineVerificationResult(
                valid=False,
                signature_ok=False,
                structure_ok=True,
                reason=f"Unknown key ID: {kid}",
                key_id=kid,
            )

        # Reconstruct the canonical message
        canonical = _build_canonical(receipt)

        # Verify the signature
        try:
            public_key = Ed25519PublicKey.from_public_bytes(raw_key)
            sig_bytes = base64.b64decode(receipt["signature"])
            public_key.verify(sig_bytes, canonical.encode("utf-8"))

            return OfflineVerificationResult(
                valid=True,
                signature_ok=True,
                structure_ok=True,
                reason="Signature verified locally",
                key_id=kid,
            )
        except Exception as e:
            return OfflineVerificationResult(
                valid=False,
                signature_ok=False,
                structure_ok=True,
                reason=f"Signature verification failed: {e}",
                key_id=kid,
            )

    @property
    def key_ids(self) -> List[str]:
        """Return all cached key IDs."""
        return list(self._keys.keys())


def _build_canonical(receipt: Dict[str, Any]) -> str:
    """
    Reconstruct the canonical message that was signed.

    Format: receipt_id|timestamp|from_agent|to_agent|capability|payload_hash|previous_hash
    """
    parts = [
        receipt.get("receipt_id", ""),
        receipt.get("timestamp", ""),
        receipt.get("agent_id", ""),
        "notary",
        receipt.get("action_type", ""),
        receipt.get("payload_hash", ""),
        receipt.get("previous_receipt_hash") or "GENESIS",
    ]
    return "|".join(parts)
