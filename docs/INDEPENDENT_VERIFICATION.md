# Independent Chain & Signature Verification

This guide explains how to verify A2A Notary receipt chains and signatures independently -- useful for:
- Audit trail integrity checks
- Detecting tampering in receipt history
- Offline chain and signature validation
- Third-party verification without server access

---

## Current Signature Type: Ed25519

The production notary uses **Ed25519** (asymmetric key signing). This means:
- **Signature verification** can be done independently with the public key (no server needed)
- **Chain verification** can be done independently (no server needed)
- **Payload hash verification** can be done independently (no server needed)

### Obtaining the Public Key

```bash
# Direct endpoint (PEM format)
curl https://api.agenttownsquare.com/v1/notary/public-key

# JWKS endpoint (RFC 7517 -- all non-revoked keys)
curl https://api.agenttownsquare.com/.well-known/jwks.json
```

Save the public key locally for fully offline verification.

### Legacy: HMAC-SHA256

Older receipts may use HMAC-SHA256 (symmetric key signing). These require the notary server API (`/v1/notary/verify`) for signature verification, as the HMAC secret is not shared.

---

## What You Can Verify Independently

| Verification Type | Independent? | How |
|-------------------|--------------|-----|
| **Signature (Ed25519)** | **Yes** | Verify with public key -- no server needed |
| **Chain Integrity** | Yes | Verify `previous_receipt_hash` links |
| **Payload Hash** | Yes | Recompute SHA-256 of original payload |
| **Timestamp Order** | Yes | Check timestamps are sequential |
| **Signature (HMAC-SHA256)** | No | Requires notary API (`/v1/notary/verify`) |

---

## Signature Verification (Ed25519)

With Ed25519 receipts, you can verify signatures completely offline using only the public key.

### Python

```python
"""
Independent Ed25519 signature verification for NotaryOS receipts.
Requires: pip install cryptography
"""

import base64
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization


def verify_ed25519_signature(receipt: dict, public_key_pem: bytes) -> bool:
    """
    Verify an Ed25519 receipt signature offline.

    Args:
        receipt: The receipt dict
        public_key_pem: PEM-encoded Ed25519 public key bytes

    Returns:
        True if signature is valid, False otherwise
    """
    # Load public key
    public_key = serialization.load_pem_public_key(public_key_pem)

    # Rebuild canonical string (must match the server's signing input)
    canonical = "|".join([
        receipt["receipt_id"],
        receipt["timestamp"],
        receipt["agent_id"],
        receipt.get("action_type", "a2a.message"),
        receipt["payload_hash"],
        receipt.get("previous_receipt_hash", "0" * 64),
    ])

    # Decode signature (base64url-encoded)
    sig_b64 = receipt["signature"]
    # Add padding if needed
    padding = 4 - len(sig_b64) % 4
    if padding != 4:
        sig_b64 += "=" * padding
    sig_bytes = base64.urlsafe_b64decode(sig_b64)

    try:
        public_key.verify(sig_bytes, canonical.encode("utf-8"))
        return True
    except Exception:
        return False


# Example usage
if __name__ == "__main__":
    import urllib.request
    import json

    # Fetch public key
    with urllib.request.urlopen("https://api.agenttownsquare.com/v1/notary/public-key") as resp:
        key_data = json.loads(resp.read().decode("utf-8"))
        pem = key_data["public_key_pem"].encode("utf-8")

    # Fetch a sample receipt
    with urllib.request.urlopen("https://api.agenttownsquare.com/v1/notary/sample-receipt") as resp:
        sample = json.loads(resp.read().decode("utf-8"))
        receipt = sample["receipt"]

    if receipt.get("signature_type") == "ed25519":
        valid = verify_ed25519_signature(receipt, pem)
        print(f"Signature valid: {valid}")
    else:
        print("Receipt uses HMAC-SHA256 -- server verification required")
```

### TypeScript

```typescript
/**
 * Independent Ed25519 signature verification for NotaryOS receipts.
 * Uses Web Crypto API (Node.js 18+, Deno, Bun, modern browsers).
 */

interface NotaryReceipt {
  receipt_id: string;
  timestamp: string;
  agent_id: string;
  action_type: string;
  payload_hash: string;
  previous_receipt_hash: string;
  signature: string;
  signature_type: string;
  key_id: string;
  schema_version?: string;
  chain_sequence?: number;
}

async function verifyEd25519Signature(
  receipt: NotaryReceipt,
  publicKeyPem: string,
): Promise<boolean> {
  // Extract raw key from PEM
  const pemBody = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  // Import public key
  const publicKey = await crypto.subtle.importKey(
    'spki',
    keyBytes,
    { name: 'Ed25519' },
    false,
    ['verify'],
  );

  // Rebuild canonical string
  const canonical = [
    receipt.receipt_id,
    receipt.timestamp,
    receipt.agent_id,
    receipt.action_type || 'a2a.message',
    receipt.payload_hash,
    receipt.previous_receipt_hash || '0'.repeat(64),
  ].join('|');

  // Decode base64url signature
  const sig = receipt.signature
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padded = sig + '='.repeat((4 - sig.length % 4) % 4);
  const sigBytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));

  // Verify
  const encoder = new TextEncoder();
  return crypto.subtle.verify(
    'Ed25519',
    publicKey,
    sigBytes,
    encoder.encode(canonical),
  );
}
```

---

## Chain Verification

The hash chain links receipts together. Each receipt's `previous_receipt_hash` should equal the SHA-256 hash of the entire previous receipt.

### Python

```python
"""
Independent chain verification for NotaryOS receipts.
No external dependencies required.
"""

import hashlib
import json


def compute_receipt_hash(receipt: dict) -> str:
    """
    Compute SHA-256 hash of a receipt for chain linking.

    This matches the algorithm used by the notary to create
    the previous_receipt_hash field.
    """
    receipt_json = json.dumps(receipt, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(receipt_json.encode()).hexdigest()


def verify_chain_integrity(receipts: list[dict]) -> dict:
    """
    Verify the integrity of a receipt chain.

    Args:
        receipts: List of receipts in chronological order

    Returns:
        Dict with verification results
    """
    result = {
        "valid": True,
        "total_receipts": len(receipts),
        "verified_links": 0,
        "broken_at": None,
        "error": None,
    }

    if not receipts:
        result["error"] = "No receipts to verify"
        return result

    for i, receipt in enumerate(receipts):
        if i == 0:
            # First receipt -- verify it has previous_receipt_hash
            if "previous_receipt_hash" not in receipt:
                result["valid"] = False
                result["broken_at"] = i
                result["error"] = "First receipt missing previous_receipt_hash"
                return result
        else:
            expected_hash = compute_receipt_hash(receipts[i - 1])
            actual_hash = receipt.get("previous_receipt_hash")

            if actual_hash != expected_hash:
                result["valid"] = False
                result["broken_at"] = i
                result["error"] = f"Chain broken at index {i}: hash mismatch"
                return result

        result["verified_links"] += 1

    return result


def verify_payload_hash(original_payload: dict | str, receipt: dict) -> bool:
    """
    Verify the receipt's payload_hash matches the original payload.

    Args:
        original_payload: The original message that was sent
        receipt: The notary receipt

    Returns:
        True if hash matches, False otherwise
    """
    if isinstance(original_payload, dict):
        payload_json = json.dumps(original_payload, sort_keys=True, separators=(",", ":"))
    else:
        payload_json = original_payload

    computed_hash = hashlib.sha256(payload_json.encode()).hexdigest()
    return computed_hash == receipt.get("payload_hash")


# Example usage
if __name__ == "__main__":
    receipt1 = {
        "receipt_id": "seal:a1b2c3d4",
        "timestamp": "2026-02-12T10:00:00Z",
        "agent_id": "agent_a",
        "action_type": "data_processing",
        "payload_hash": "abc123...",
        "previous_receipt_hash": "GENESIS",
        "signature": "sig1...",
        "signature_type": "ed25519",
        "key_id": "ed25519-key-v1",
    }

    receipt2 = {
        "receipt_id": "seal:e5f6g7h8",
        "timestamp": "2026-02-12T10:01:00Z",
        "agent_id": "agent_a",
        "action_type": "api_call",
        "payload_hash": "def456...",
        "previous_receipt_hash": compute_receipt_hash(receipt1),
        "signature": "sig2...",
        "signature_type": "ed25519",
        "key_id": "ed25519-key-v1",
    }

    chain = [receipt1, receipt2]
    result = verify_chain_integrity(chain)

    print(f"Chain valid: {result['valid']}")
    print(f"Links verified: {result['verified_links']}/{result['total_receipts']}")
```

### TypeScript

```typescript
/**
 * Independent chain verification for NotaryOS receipts.
 * Uses Web Crypto API (Node.js 18+, Deno, Bun, modern browsers).
 */

interface ChainVerificationResult {
  valid: boolean;
  totalReceipts: number;
  verifiedLinks: number;
  brokenAt: number | null;
  error: string | null;
}

async function computeReceiptHash(receipt: NotaryReceipt): Promise<string> {
  const receiptJson = JSON.stringify(receipt, Object.keys(receipt).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(receiptJson);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyChainIntegrity(
  receipts: NotaryReceipt[],
): Promise<ChainVerificationResult> {
  const result: ChainVerificationResult = {
    valid: true,
    totalReceipts: receipts.length,
    verifiedLinks: 0,
    brokenAt: null,
    error: null,
  };

  if (receipts.length === 0) {
    result.error = 'No receipts to verify';
    return result;
  }

  for (let i = 0; i < receipts.length; i++) {
    if (i === 0) {
      if (!receipts[i].previous_receipt_hash) {
        result.valid = false;
        result.brokenAt = i;
        result.error = 'First receipt missing previous_receipt_hash';
        return result;
      }
    } else {
      const expectedHash = await computeReceiptHash(receipts[i - 1]);
      const actualHash = receipts[i].previous_receipt_hash;

      if (actualHash !== expectedHash) {
        result.valid = false;
        result.brokenAt = i;
        result.error = `Chain broken at index ${i}: hash mismatch`;
        return result;
      }
    }

    result.verifiedLinks++;
  }

  return result;
}

async function verifyPayloadHash(
  originalPayload: Record<string, unknown> | string,
  receipt: NotaryReceipt,
): Promise<boolean> {
  const payloadJson =
    typeof originalPayload === 'string'
      ? originalPayload
      : JSON.stringify(originalPayload, Object.keys(originalPayload).sort());

  const encoder = new TextEncoder();
  const data = encoder.encode(payloadJson);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return computedHash === receipt.payload_hash;
}
```

---

## Tampering Detection

The hash chain detects tampering because:

1. **Modification** -- If any receipt is changed, its hash changes
2. **The next receipt's `previous_receipt_hash` no longer matches**
3. **Chain verification fails, pinpointing the tampered receipt**

### Example: Detecting a Tampered Receipt

```python
def detect_tampering(receipts: list[dict]) -> dict:
    """Detect which receipt was tampered with."""
    result = verify_chain_integrity(receipts)

    if result["valid"]:
        return {"tampered": False, "message": "Chain is intact"}

    broken_at = result["broken_at"]

    if broken_at == 0:
        return {
            "tampered": True,
            "message": "First receipt was modified or is invalid",
            "index": 0,
        }

    return {
        "tampered": True,
        "message": f"Receipt at index {broken_at - 1} was modified",
        "index": broken_at - 1,
        "receipt_id": receipts[broken_at - 1].get("receipt_id"),
    }
```

---

## Payload Hash Verification

If you have the original message payload, verify it matches the receipt:

```python
import hashlib
import json

def verify_original_payload(original: dict, receipt: dict) -> dict:
    """Verify the original payload matches the receipt's hash."""
    payload_json = json.dumps(original, sort_keys=True, separators=(",", ":"))
    computed_hash = hashlib.sha256(payload_json.encode()).hexdigest()

    return {
        "matches": computed_hash == receipt["payload_hash"],
        "computed_hash": computed_hash,
        "receipt_hash": receipt["payload_hash"],
    }


# Example
original_payload = {"action": "transfer", "amount": 100, "to": "agent_b"}
receipt = {"payload_hash": "abc123..."}

result = verify_original_payload(original_payload, receipt)
if result["matches"]:
    print("Payload content verified!")
else:
    print("Payload was modified!")
```

---

## Timestamp Verification

Verify timestamps are in chronological order:

```python
from datetime import datetime

def verify_timestamps(receipts: list[dict]) -> dict:
    """Verify receipt timestamps are in chronological order."""
    issues = []

    for i in range(1, len(receipts)):
        prev_time = datetime.fromisoformat(
            receipts[i - 1]["timestamp"].replace("Z", "+00:00")
        )
        curr_time = datetime.fromisoformat(
            receipts[i]["timestamp"].replace("Z", "+00:00")
        )

        if curr_time < prev_time:
            issues.append({
                "index": i,
                "receipt_id": receipts[i]["receipt_id"],
                "issue": "Timestamp earlier than previous receipt",
            })

    return {
        "valid": len(issues) == 0,
        "issues": issues,
    }
```

---

## Complete Audit Workflow

For a comprehensive audit combining all verification methods:

```python
def perform_audit(receipts: list[dict], public_key_pem: bytes = None) -> dict:
    """
    Perform a complete audit of a receipt chain.

    Args:
        receipts: List of receipt dicts in chronological order
        public_key_pem: Ed25519 public key PEM bytes (for offline sig verification)
    """
    report = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "total_receipts": len(receipts),
        "chain_verification": None,
        "timestamp_verification": None,
        "signature_verification": [],
        "summary": None,
    }

    # 1. Verify chain integrity (offline)
    report["chain_verification"] = verify_chain_integrity(receipts)

    # 2. Verify timestamps (offline)
    report["timestamp_verification"] = verify_timestamps(receipts)

    # 3. Verify signatures
    for receipt in receipts:
        sig_type = receipt.get("signature_type", "")

        if sig_type == "ed25519" and public_key_pem:
            # Fully offline Ed25519 verification
            valid = verify_ed25519_signature(receipt, public_key_pem)
            report["signature_verification"].append({
                "receipt_id": receipt["receipt_id"],
                "valid": valid,
                "method": "ed25519_offline",
            })
        else:
            # HMAC receipts require server verification
            import urllib.request
            import json as json_mod
            url = "https://api.agenttownsquare.com/v1/notary/verify"
            data = json_mod.dumps({"receipt": receipt}).encode("utf-8")
            req = urllib.request.Request(
                url, data=data, headers={"Content-Type": "application/json"}, method="POST"
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json_mod.loads(resp.read().decode("utf-8"))
            report["signature_verification"].append({
                "receipt_id": receipt["receipt_id"],
                "valid": result["valid"],
                "method": "server_api",
                "reason": result.get("reason", ""),
            })

    # 4. Summary
    chain_ok = report["chain_verification"]["valid"]
    timestamps_ok = report["timestamp_verification"]["valid"]
    signatures_ok = all(v["valid"] for v in report["signature_verification"])

    report["summary"] = {
        "chain_intact": chain_ok,
        "timestamps_valid": timestamps_ok,
        "signatures_valid": signatures_ok,
        "overall_valid": chain_ok and timestamps_ok and signatures_ok,
    }

    return report
```

---

## Offline Verification Workflow

With Ed25519 receipts, **all three verification types** can be performed completely offline:

1. **Export receipts** from your system
2. **Obtain the public key** (once, from `/v1/notary/public-key`)
3. **Verify signatures offline** using Ed25519 public key
4. **Verify chain integrity** (no network needed)
5. **Verify timestamps** (no network needed)
6. **Verify payload hashes** if you have original payloads (no network needed)

```python
# Fully offline verification (Ed25519)
for receipt in receipts:
    sig_valid = verify_ed25519_signature(receipt, public_key_pem)
    print(f"  {receipt['receipt_id']}: signature {'OK' if sig_valid else 'FAILED'}")

chain_result = verify_chain_integrity(receipts)
timestamp_result = verify_timestamps(receipts)

print(f"Chain intact: {chain_result['valid']}")
print(f"Timestamps valid: {timestamp_result['valid']}")
```

> **Note:** Receipts signed with HMAC-SHA256 (legacy) still require the server API for signature verification. Chain and timestamp verification work offline regardless of signature type.

---

## Troubleshooting

### "Chain verification failed at index N"

1. The receipt at index N-1 was modified
2. A receipt was deleted from the chain
3. A receipt was inserted out of order

### "Hash mismatch"

1. Original payload was serialized differently
2. Payload was modified after receipt creation
3. JSON serialization uses different key ordering

**Fix:** Ensure you use `sort_keys=True` and `separators=(",", ":")` when serializing JSON.

### "Signature verification failed"

1. Receipt was tampered with after signing
2. Wrong public key (check `key_id` field matches JWKS)
3. Key was rotated -- fetch updated JWKS from `/.well-known/jwks.json`

### "Timestamp out of order"

1. Clock skew between agents
2. Receipt was backdated
3. Chain was reordered

---

*NotaryOS Independent Verification Guide v1.5.21 | notaryos.org*
