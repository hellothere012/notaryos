# A2A Notary Receipt Specification

> **Protocol Version:** 1.0.0
>
> **Status:** Production
>
> **Last Updated:** 2026-02-01
>
> **Authors:** Agent Town Square

---

## Overview

This document defines the canonical format for A2A Notary receipts, including field definitions, canonicalization rules, and signature algorithms. All implementations MUST follow this specification to ensure interoperability and consistent verification.

---

## Table of Contents

1. [Receipt Structure](#receipt-structure)
2. [Field Definitions](#field-definitions)
3. [Canonicalization Algorithm](#canonicalization-algorithm)
4. [Signature Algorithms](#signature-algorithms)
5. [Verification Procedure](#verification-procedure)
6. [Error Codes](#error-codes)
7. [Sample Receipts](#sample-receipts)
8. [Version History](#version-history)

---

## Receipt Structure

A receipt is a JSON object with the following structure:

```json
{
  "receipt_id": "receipt_demo_abc123def456",
  "timestamp": "2026-02-01T12:00:00.000000+00:00",
  "from_agent": "analysis_agent",
  "to_agent": "financial_agent",
  "capability": "financial.earnings_analysis",
  "message_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "previous_receipt_hash": "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
  "signature": "MEUCIQDx...",
  "signature_type": "ed25519",
  "key_id": "ed25519-key-v1",
  "public_key_ref": "-----BEGIN PUBLIC KEY-----\n..."
}
```

---

## Field Definitions

### Required Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `receipt_id` | string | Unique receipt identifier | Pattern: `receipt_[a-z0-9_]+`, max 64 chars |
| `timestamp` | string | ISO 8601 timestamp with timezone | MUST include timezone offset |
| `from_agent` | string | Sender agent identifier | Non-empty, max 128 chars |
| `to_agent` | string | Receiver agent identifier | Non-empty, max 128 chars |
| `capability` | string | A2A capability used | Dot-notation, e.g., `financial.analyze` |
| `message_hash` | string | SHA-256 hash of the payload | Lowercase hex, 64 chars |
| `signature` | string | Cryptographic signature | Base64url for Ed25519, hex for HMAC |
| `signature_type` | string | Signature algorithm | `ed25519` or `hmac-sha256` |
| `key_id` | string | Signing key identifier | Non-empty, max 64 chars |

### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `previous_receipt_hash` | string | Hash of previous receipt in chain | `null` (genesis receipt) |
| `public_key_ref` | string | PEM-encoded public key | `null` (use server key) |
| `chain_sequence` | integer | Position in agent's receipt chain | Not present if unchained |
| `metadata` | object | Additional context | Empty object |

### Field Details

#### `receipt_id`

- **Format:** `receipt_[type]_[random]`
- **Examples:**
  - `receipt_demo_abc123def456` (demo/sample receipt)
  - `receipt_prod_xyz789ghi012` (production receipt)
- **Generation:** Use cryptographically secure random bytes (minimum 12 bytes, base64url encoded)

#### `timestamp`

- **Format:** ISO 8601 with microsecond precision
- **Timezone:** MUST be UTC (suffix `+00:00` or `Z`)
- **Examples:**
  - `2026-02-01T12:00:00.000000+00:00` (preferred)
  - `2026-02-01T12:00:00Z` (acceptable)
- **Validation:** Must be within 1 hour of current time for new receipts

#### `message_hash`

- **Algorithm:** SHA-256
- **Format:** Lowercase hexadecimal, exactly 64 characters
- **Input:** Canonicalized JSON of the payload (see Canonicalization)

#### `signature`

- **Ed25519:** Base64url-encoded signature (86 characters without padding)
- **HMAC-SHA256:** Hexadecimal string (64 characters)

---

## Canonicalization Algorithm

Canonicalization ensures consistent signature generation and verification across implementations.

### Rules

1. **JSON Serialization:**
   - Use UTF-8 encoding
   - No BOM (Byte Order Mark)
   - No trailing newline

2. **Key Ordering:**
   - Object keys MUST be sorted lexicographically (ASCII order)
   - Sorting is recursive for nested objects

3. **Whitespace:**
   - No whitespace between tokens
   - No indentation
   - No trailing spaces

4. **Numbers:**
   - No leading zeros (except for `0.x` decimals)
   - No trailing zeros after decimal point
   - No positive sign for positive numbers
   - Use exponential notation for very large/small numbers

5. **Strings:**
   - Escape special characters: `\", \\, \n, \r, \t`
   - Unicode escapes in lowercase: `\u00e9`
   - No unnecessary escaping

6. **Null/Boolean:**
   - Use lowercase: `null`, `true`, `false`

7. **Arrays:**
   - Preserve order
   - Apply canonicalization recursively to elements

### Signature Data Construction

The signature is computed over a pipe-separated string of canonical values:

```
{receipt_id}|{timestamp}|{from_agent}|{to_agent}|{capability}|{message_hash}|{previous_receipt_hash}
```

Where:
- `{previous_receipt_hash}` is `"GENESIS"` if null/absent

### Reference Implementation (Python)

```python
import json
import hashlib

def canonicalize_json(obj) -> str:
    """Produce canonical JSON string."""
    return json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False)

def compute_message_hash(payload: dict) -> str:
    """Compute SHA-256 hash of canonicalized payload."""
    canonical = canonicalize_json(payload)
    return hashlib.sha256(canonical.encode('utf-8')).hexdigest()

def build_signature_data(receipt: dict) -> bytes:
    """Build the data string to be signed."""
    previous = receipt.get('previous_receipt_hash') or 'GENESIS'
    sig_data = (
        f"{receipt['receipt_id']}|"
        f"{receipt['timestamp']}|"
        f"{receipt['from_agent']}|"
        f"{receipt['to_agent']}|"
        f"{receipt['capability']}|"
        f"{receipt['message_hash']}|"
        f"{previous}"
    )
    return sig_data.encode('utf-8')
```

### Reference Implementation (TypeScript)

```typescript
function canonicalizeJson(obj: unknown): string {
  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return JSON.stringify(obj);
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    const pairs = keys.map(k => `${JSON.stringify(k)}:${canonicalizeJson((obj as Record<string, unknown>)[k])}`);
    return '{' + pairs.join(',') + '}';
  }
  throw new Error('Unsupported type');
}

function computeMessageHash(payload: object): string {
  const canonical = canonicalizeJson(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  // Use SubtleCrypto or crypto library
  return sha256Hex(data);
}

function buildSignatureData(receipt: Receipt): Uint8Array {
  const previous = receipt.previous_receipt_hash || 'GENESIS';
  const sigData = [
    receipt.receipt_id,
    receipt.timestamp,
    receipt.from_agent,
    receipt.to_agent,
    receipt.capability,
    receipt.message_hash,
    previous
  ].join('|');
  return new TextEncoder().encode(sigData);
}
```

---

## Signature Algorithms

### Ed25519 (Recommended)

**Properties:**
- Asymmetric (private key signs, public key verifies)
- Third-party verifiable
- 64-byte signature
- Fast verification (~15,000 verifications/second)

**Key Format:**
- Private key: PKCS8 PEM-encoded
- Public key: SubjectPublicKeyInfo PEM-encoded

**Signature Format:**
- Base64url-encoded (RFC 4648 Section 5)
- No padding characters

**Verification:**
```python
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
import base64

def verify_ed25519(data: bytes, signature: str, public_key_pem: str) -> bool:
    public_key = serialization.load_pem_public_key(public_key_pem.encode())
    sig_bytes = base64.urlsafe_b64decode(signature + '==')
    try:
        public_key.verify(sig_bytes, data)
        return True
    except:
        return False
```

### HMAC-SHA256 (Legacy)

**Properties:**
- Symmetric (same key signs and verifies)
- Server-only verification
- 32-byte signature (64 hex chars)
- Simpler key management

**Key Format:**
- Raw bytes (minimum 256 bits)

**Signature Format:**
- Lowercase hexadecimal

**Verification:**
```python
import hmac
import hashlib

def verify_hmac(data: bytes, signature: str, secret_key: bytes) -> bool:
    expected = hmac.new(secret_key, data, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)
```

---

## Verification Procedure

### Step 1: Structure Validation

Check all required fields are present and have valid types/formats.

### Step 2: Reconstruct Signature Data

```
sig_data = "{receipt_id}|{timestamp}|{from_agent}|{to_agent}|{capability}|{message_hash}|{previous_or_GENESIS}"
```

### Step 3: Verify Signature

Based on `signature_type`:
- **Ed25519:** Use public key from `public_key_ref` or fetch from `/v1/notary/public-key`
- **HMAC-SHA256:** Use shared secret (server-only)

### Step 4: Chain Validation (if applicable)

If `previous_receipt_hash` is present:
1. Fetch the previous receipt
2. Verify the hash matches
3. Verify the chain is unbroken

### Step 5: Timestamp Validation

- Receipt timestamp should be recent (configurable tolerance, default 1 hour)
- Timestamp should be after previous receipt in chain

---

## Error Codes

Standardized error codes for consistent error handling:

| Code | HTTP | Description |
|------|------|-------------|
| `ERR_RECEIPT_NOT_FOUND` | 404 | Receipt ID does not exist in database |
| `ERR_INVALID_SIGNATURE` | 400 | Signature verification failed |
| `ERR_INVALID_STRUCTURE` | 400 | Missing or malformed required fields |
| `ERR_INVALID_TIMESTAMP` | 400 | Timestamp format invalid or out of range |
| `ERR_UNKNOWN_SIGNER` | 400 | Key ID not recognized |
| `ERR_UNSUPPORTED_ALGORITHM` | 400 | Signature type not supported |
| `ERR_CHAIN_BROKEN` | 400 | Previous receipt hash mismatch |
| `ERR_CHAIN_MISSING` | 404 | Previous receipt not found |
| `ERR_PAYLOAD_TOO_LARGE` | 413 | Receipt exceeds 10KB limit |
| `ERR_RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `ERR_INVALID_API_KEY` | 401 | API key invalid or inactive |
| `ERR_INSUFFICIENT_SCOPE` | 403 | API key lacks required scope |
| `ERR_INTERNAL_ERROR` | 500 | Internal server error |

### Error Response Format

```json
{
  "error": {
    "code": "ERR_INVALID_SIGNATURE",
    "message": "Signature verification failed - receipt may have been tampered with",
    "details": {
      "receipt_id": "receipt_demo_abc123",
      "signature_type": "ed25519",
      "verification_method": "embedded_public_key"
    }
  },
  "request_id": "req_xyz789",
  "timestamp": "2026-02-01T12:00:00.000000+00:00"
}
```

---

## Sample Receipts

### Genesis Receipt (No Chain)

```json
{
  "receipt_id": "receipt_prod_genesis001",
  "timestamp": "2026-02-01T10:00:00.000000+00:00",
  "from_agent": "whisper_agent",
  "to_agent": "translation_agent",
  "capability": "translation.translate",
  "message_hash": "7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730",
  "previous_receipt_hash": null,
  "signature": "MEUCIQD...",
  "signature_type": "ed25519",
  "key_id": "ed25519-key-v1",
  "public_key_ref": "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA...\n-----END PUBLIC KEY-----"
}
```

### Chained Receipt

```json
{
  "receipt_id": "receipt_prod_chain002",
  "timestamp": "2026-02-01T10:05:00.000000+00:00",
  "from_agent": "translation_agent",
  "to_agent": "financial_agent",
  "capability": "financial.analyze",
  "message_hash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
  "previous_receipt_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "chain_sequence": 2,
  "signature": "MEQCIAo...",
  "signature_type": "ed25519",
  "key_id": "ed25519-key-v1"
}
```

### Demo Receipt (Sample Endpoint)

```json
{
  "receipt_id": "receipt_demo_sample123",
  "timestamp": "2026-02-01T12:00:00.000000+00:00",
  "from_agent": "analysis_agent",
  "to_agent": "financial_agent",
  "capability": "financial.earnings_analysis",
  "message_hash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
  "previous_receipt_hash": "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
  "signature": "MEUCIQDx7...",
  "signature_type": "ed25519",
  "key_id": "ed25519-key-v1",
  "public_key_ref": "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA...\n-----END PUBLIC KEY-----"
}
```

---

## Version History

| Version | Date | Changes | Breaking |
|---------|------|---------|----------|
| 1.0.0 | 2026-02-01 | Initial specification | N/A |

### Breaking Change Policy

- **Major version (X.0.0):** Breaking changes to receipt structure or signature format
- **Minor version (0.X.0):** New optional fields, new error codes
- **Patch version (0.0.X):** Documentation clarifications, reference implementation fixes

**Deprecation Process:**
1. Announce deprecation in CHANGELOG with timeline
2. Maintain backward compatibility for minimum 6 months
3. Provide migration guide
4. Remove deprecated feature in next major version

---

## Appendix A: Test Vectors

### Canonicalization Test

**Input:**
```json
{
  "z": 1,
  "a": "hello",
  "m": [3, 1, 2],
  "nested": {
    "b": true,
    "a": null
  }
}
```

**Expected Canonical Output:**
```json
{"a":"hello","m":[3,1,2],"nested":{"a":null,"b":true},"z":1}
```

**SHA-256 Hash:**
```
f5ca38f748a1d6eaf726b8a42fb575c3c71f1864a8143301782de13da2d9202b
```

### Signature Data Test

**Receipt:**
```json
{
  "receipt_id": "receipt_test_001",
  "timestamp": "2026-02-01T00:00:00.000000+00:00",
  "from_agent": "agent_a",
  "to_agent": "agent_b",
  "capability": "test.capability",
  "message_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "previous_receipt_hash": null
}
```

**Expected Signature Data:**
```
receipt_test_001|2026-02-01T00:00:00.000000+00:00|agent_a|agent_b|test.capability|e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855|GENESIS
```

---

## Appendix B: SDK Examples

See the `/sdk/` directory for complete SDK implementations:

- **Python:** `sdk/python/`
- **TypeScript:** `sdk/typescript/`
- **Go:** `sdk/go/`
- **Rust:** Coming soon

---

*Specification by Agent Town Square*
