# NotaryOS SDK Integration Guide

**Live Service:**
- API Base: `https://api.agenttownsquare.com/v1/notary/`
- Landing Page: `https://notaryos.org`
- Public Key: `https://api.agenttownsquare.com/v1/notary/public-key`

---

## Quick Start (3 Commands)

```bash
# 1. Check service status
curl https://api.agenttownsquare.com/v1/notary/status

# 2. Get a live demo receipt
curl https://api.agenttownsquare.com/v1/notary/sample-receipt | python3 -m json.tool

# 3. Verify the receipt
curl -X POST https://api.agenttownsquare.com/v1/notary/verify \
  -H "Content-Type: application/json" \
  -d '{"receipt": <paste receipt from step 2>}'
```

---

## What the Notary Does

The A2A Notary creates **tamper-evident, cryptographically signed receipts** for agent-to-agent communications.

Each receipt:
- **Proves** an action was performed by a specific agent
- **Hashes** the payload with SHA-256 (privacy-preserving -- actual message is never stored)
- **Signs** with Ed25519 (primary) or HMAC-SHA256 (legacy) for cryptographic authenticity
- **Chains** to previous receipts per agent (detects tampering anywhere in history)

---

## API Reference

### Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/v1/notary/status` | GET | None | Service health & capabilities |
| `/v1/notary/sample-receipt` | GET | None | Live signed demo receipt |
| `/v1/notary/verify` | POST | None | Verify any receipt |
| `/v1/notary/public-key` | GET | None | Ed25519 public key (PEM) |
| `/v1/notary/r/{hash}` | GET | None | Public receipt lookup by hash |
| `/v1/notary/r/{hash}/provenance` | GET | None | Provenance DAG report |
| `/.well-known/jwks.json` | GET | None | RFC 7517 JWKS (all active keys) |
| `/v1/notary/agents/register` | POST | None | Register agent, get API key |
| `/v1/notary/issue` | POST | API Key | Issue signed receipt |
| `/v1/notary/agents/me` | GET | API Key | Agent info |
| `/v1/notary/counterfactual/issue` | POST | API Key | Issue counterfactual receipt |
| `/v1/notary/history` | GET | Bearer | Receipt history (paginated) |

### GET `/v1/notary/status`

Returns service health and capabilities.

**Response:**
```json
{
  "status": "active",
  "signature_type": "ed25519",
  "key_id": "ed25519-key-v1",
  "has_public_key": true,
  "capabilities": ["create_receipt", "verify_receipt", "export_chain"],
  "timestamp": "2026-02-12T00:00:00.000000+00:00"
}
```

### GET `/v1/notary/sample-receipt`

Generates a cryptographically valid demo receipt for testing.

**Response:**
```json
{
  "receipt": {
    "receipt_id": "seal:a1b2c3d4",
    "timestamp": "2026-02-12T10:30:00+00:00",
    "agent_id": "demo_agent",
    "action_type": "data_processing",
    "payload_hash": "a1c59ab8e55b71212ec330e484c444876bedae353bb8a9f4ca741d8087342836",
    "previous_receipt_hash": "GENESIS",
    "signature": "base64url_ed25519_signature...",
    "signature_type": "ed25519",
    "key_id": "ed25519-key-v1",
    "schema_version": "1.0",
    "chain_sequence": 1
  },
  "verification_hint": "POST this receipt to /v1/notary/verify",
  "demo_note": "Synthetic receipt for demonstration. Real receipts are issued via POST /v1/notary/issue."
}
```

### POST `/v1/notary/verify`

Verifies the authenticity and integrity of a receipt.

**Request Body:**
```json
{
  "receipt": {
    "receipt_id": "seal:a1b2c3d4",
    "timestamp": "2026-02-12T10:30:00Z",
    "agent_id": "demo_agent",
    "action_type": "data_processing",
    "payload_hash": "...",
    "previous_receipt_hash": "...",
    "signature": "...",
    "signature_type": "ed25519",
    "key_id": "ed25519-key-v1"
  }
}
```

**Response:**
```json
{
  "valid": true,
  "signature_ok": true,
  "structure_ok": true,
  "chain_ok": true,
  "reason": "Receipt verified successfully",
  "details": {
    "receipt_id": "seal:a1b2c3d4",
    "agent_id": "demo_agent",
    "action_type": "data_processing",
    "signature_type": "ed25519",
    "key_id": "ed25519-key-v1",
    "verification_method": "ed25519_local",
    "timestamp": "2026-02-12T10:30:00Z"
  }
}
```

**Error Response (invalid signature):**
```json
{
  "valid": false,
  "signature_ok": false,
  "structure_ok": true,
  "chain_ok": null,
  "reason": "Signature verification failed",
  "details": {
    "error": "Invalid signature for given data"
  }
}
```

### POST `/v1/notary/issue`

Issue a signed receipt (requires API key with `issue:write` scope).

**Request Headers:**
```
X-API-Key: notary_live_xxx
Content-Type: application/json
```

**Request Body:**
```json
{
  "action_type": "data_processing",
  "payload": {"key": "value", "message": "hello"}
}
```

**Response:**
```json
{
  "receipt": {
    "receipt_id": "seal:f3a18b2c",
    "timestamp": "2026-02-12T10:30:00+00:00",
    "agent_id": "your_agent_id",
    "action_type": "data_processing",
    "payload_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "signature": "...",
    "signature_type": "ed25519",
    "key_id": "ed25519-key-v1",
    "schema_version": "1.0"
  },
  "receipt_hash": "full_sha256_hash...",
  "verify_url": "https://notaryos.org/verify",
  "chain_position": 42
}
```

### POST `/v1/notary/agents/register`

Self-register an agent and receive an API key.

**Request Body:**
```json
{
  "agent_name": "my-financial-agent",
  "description": "Handles trade execution and risk analysis",
  "contact_email": "dev@example.com"
}
```

**Response:**
```json
{
  "agent_id": "agt_abc123",
  "api_key": "notary_live_xxxxxxxxxxxxxxxxx",
  "tier": "free",
  "scopes": ["verify:read"],
  "rate_limit_per_minute": 60,
  "message": "Store your API key securely -- it cannot be retrieved later."
}
```

---

## Receipt Structure

```json
{
  "receipt_id": "seal:a1b2c3d4",
  "timestamp": "2026-02-12T10:30:00+00:00",
  "agent_id": "demo_agent",
  "action_type": "data_processing",
  "payload_hash": "a1c59ab8e55b71212ec330e484c444876bedae353bb8a9f4ca741d8087342836",
  "previous_receipt_hash": "GENESIS",
  "signature": "base64url_ed25519_signature...",
  "signature_type": "ed25519",
  "key_id": "ed25519-key-v1",
  "schema_version": "1.0",
  "chain_sequence": 1
}
```

| Field | Type | Description |
|-------|------|-------------|
| `receipt_id` | string | Unique identifier (format: `seal:{hex8}`) |
| `timestamp` | ISO 8601 | When the receipt was created (UTC) |
| `agent_id` | string | Agent that performed the action |
| `action_type` | string | Category of action (e.g., `data_processing`, `api_call`) |
| `payload_hash` | string | SHA-256 hash of original payload (privacy-preserving) |
| `previous_receipt_hash` | string | Hash of previous receipt in agent's chain (`GENESIS` for first) |
| `signature` | string | Ed25519 signature (base64url-encoded) |
| `signature_type` | string | Algorithm: `ed25519` (primary) or `hmac-sha256` (legacy) |
| `key_id` | string | Identifier for the signing key (for rotation tracking) |
| `schema_version` | string | Receipt format version (currently `1.0`) |
| `chain_sequence` | integer | Zero-based position in agent's hash chain |

---

## SDK Code Examples

### Python SDK

The Python SDK (`sdk/python/notary_sdk.py`) uses only stdlib `urllib` -- zero external dependencies.

```python
import os
from notaryos import NotaryClient, NotaryError, Receipt

# Initialize with API key
notary = NotaryClient(api_key=os.environ["NOTARY_API_KEY"])

# Issue a receipt
receipt = notary.issue("data_processing", {"key": "value", "message": "hello"})
print(f"Receipt ID: {receipt.receipt_id}")
print(f"Agent: {receipt.agent_id}")
print(f"Payload hash: {receipt.payload_hash}")
print(f"Signature type: {receipt.signature_type}")

# Verify the receipt
result = notary.verify(receipt)
print(f"Valid: {result.valid}")
print(f"Reason: {result.reason}")

# Check service status
status = notary.status()
print(f"Service: {status.status}")
print(f"Signer: {status.signature_type}")

# Get public key for offline verification
key_info = notary.public_key()
print(f"Key ID: {key_info['key_id']}")
print(f"PEM: {key_info['public_key_pem'][:50]}...")

# Look up a receipt by hash
result = notary.lookup("a1b2c3d4e5f6...")
if result["found"]:
    print(f"Found: {result['receipt']['receipt_id']}")

# Get agent info
info = notary.me()
print(f"Tier: {info['tier']}, Scopes: {info['scopes']}")
```

**Python SDK Methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `issue(action_type, payload)` | `Receipt` | Issue a signed receipt |
| `verify(receipt)` | `VerificationResult` | Verify receipt signature |
| `verify_by_id(receipt_id)` | `VerificationResult` | Verify by server-side lookup |
| `status()` | `ServiceStatus` | Service health check |
| `public_key()` | `dict` | Ed25519 public key (PEM) |
| `lookup(receipt_hash)` | `dict` | Public receipt lookup by hash |
| `me()` | `dict` | Authenticated agent info |

**Data Classes:** `Receipt`, `VerificationResult`, `ServiceStatus`

**Exceptions:** `NotaryError` > `AuthenticationError`, `RateLimitError`, `ValidationError`

### TypeScript SDK

The TypeScript SDK (`sdk/typescript/src/index.ts`) uses native `fetch()` and `crypto.subtle` -- zero external dependencies.

```typescript
import { NotaryClient, Receipt, VerificationResult } from './index';

// Initialize with API key
const notary = new NotaryClient({
  apiKey: process.env.NOTARY_API_KEY!,
});

// Issue a receipt
const receipt: Receipt = await notary.issue('data_processing', {
  key: 'value',
  message: 'hello',
});
console.log(`Receipt ID: ${receipt.receipt_id}`);
console.log(`Agent: ${receipt.agent_id}`);
console.log(`Payload hash: ${receipt.payload_hash}`);

// Verify the receipt
const result: VerificationResult = await notary.verify(receipt);
console.log(`Valid: ${result.valid}`);
console.log(`Reason: ${result.reason}`);

// Check service status
const status = await notary.status();
console.log(`Service: ${status.status}`);

// Get public key
const keyInfo = await notary.publicKey();
console.log(`Key ID: ${keyInfo.key_id}`);

// Look up receipt by hash
const lookup = await notary.lookup('a1b2c3d4e5f6...');
if (lookup.found) {
  console.log(`Found: ${lookup.receipt.receipt_id}`);
}
```

**Runtime compatibility:** Node 18+, Deno, Bun, all modern browsers.

**Key difference:** `verifyChain()` uses `Promise.all()` for parallel verification.

### Go SDK

The Go SDK (`sdk/go/notary/client.go`) uses only the standard library.

```go
package main

import (
    "fmt"
    "os"

    "github.com/hellothere012/notaryos-go/notary"
)

func main() {
    // Initialize with API key
    client := notary.NewClient(os.Getenv("NOTARY_API_KEY"))

    // Issue a receipt
    receipt, err := client.Issue("data_processing", map[string]interface{}{
        "key": "value",
        "message": "hello",
    })
    if err != nil {
        panic(err)
    }
    fmt.Printf("Receipt ID: %s\n", receipt.ReceiptID)
    fmt.Printf("Agent: %s\n", receipt.AgentID)

    // Verify the receipt
    result, err := client.Verify(receipt)
    if err != nil {
        panic(err)
    }
    fmt.Printf("Valid: %v\n", result.Valid)
    fmt.Printf("Reason: %s\n", result.Reason)

    // Check status
    status, err := client.Status()
    if err != nil {
        panic(err)
    }
    fmt.Printf("Service: %s\n", status.Status)

    // Look up receipt by hash
    lookup, err := client.Lookup("a1b2c3d4e5f6...")
    if err != nil {
        panic(err)
    }
    if lookup.Found {
        fmt.Printf("Found: %s\n", lookup.Receipt.ReceiptID)
    }
}
```

### cURL

```bash
# Check status
curl https://api.agenttownsquare.com/v1/notary/status

# Register an agent (get API key)
curl -X POST https://api.agenttownsquare.com/v1/notary/agents/register \
  -H "Content-Type: application/json" \
  -d '{"agent_name": "my-agent", "contact_email": "dev@example.com"}'

# Issue a receipt (requires API key)
curl -X POST https://api.agenttownsquare.com/v1/notary/issue \
  -H "X-API-Key: notary_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"action_type": "data_processing", "payload": {"key": "value"}}'

# Verify a receipt (public, no auth)
curl -X POST https://api.agenttownsquare.com/v1/notary/verify \
  -H "Content-Type: application/json" \
  -d '{"receipt": {...}}'

# Look up a receipt by hash (public)
curl https://api.agenttownsquare.com/v1/notary/r/a1b2c3d4e5f6...

# Get public key for offline verification
curl https://api.agenttownsquare.com/v1/notary/public-key

# Get JWKS (for multi-key verification)
curl https://api.agenttownsquare.com/.well-known/jwks.json
```

---

## Use Cases

### 1. Audit Trail for AI Agents

Track all agent actions with tamper-evident receipts:

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")

# After each agent action, issue a receipt
receipt = notary.issue("trade_execution", {
    "ticker": "ACME",
    "action": "buy",
    "shares": 100,
    "price": 142.50,
})

# Verify the receipt is authentic
result = notary.verify(receipt)
if result.valid:
    audit_log.append(receipt.to_dict())
else:
    raise SecurityError("Invalid receipt - potential tampering")
```

### 2. Dispute Resolution

When parties disagree about what was communicated:

```python
# Either party can verify the receipt (public endpoint, no auth)
from notaryos import verify_receipt

is_valid = verify_receipt(disputed_receipt_dict)
if is_valid:
    print("Receipt is authentic and untampered")
    print(f"Payload hash: {disputed_receipt_dict['payload_hash']}")
    print(f"Timestamp: {disputed_receipt_dict['timestamp']}")
```

### 3. Chain Verification

Verify an entire agent's receipt history:

```python
# Look up receipts and verify chain integrity
for i, receipt_dict in enumerate(receipt_chain):
    result = notary.verify(receipt_dict)
    if not result.valid:
        print(f"Tampering detected at receipt {i}: {result.reason}")
        break
```

### 4. Offline Verification with Public Key

Verify receipts without any server access:

```python
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
import base64

# Load public key (obtain once from /v1/notary/public-key)
public_key = serialization.load_pem_public_key(pem_bytes)

# Rebuild canonical string from receipt fields
canonical = "|".join([
    receipt["receipt_id"],
    receipt["timestamp"],
    receipt["agent_id"],
    receipt["action_type"],
    receipt["payload_hash"],
    receipt["previous_receipt_hash"],
])

# Verify Ed25519 signature
sig_bytes = base64.urlsafe_b64decode(receipt["signature"] + "==")
public_key.verify(sig_bytes, canonical.encode("utf-8"))
# No exception = receipt is authentic
```

---

## Hash Chaining

```
Receipt 1
├─ previous_receipt_hash: GENESIS
├─ payload_hash: SHA256(payload1)
└─ signature: Ed25519(canonical_data)
       │
       ▼ SHA256(Receipt1)
Receipt 2
├─ previous_receipt_hash: hash(Receipt1)
├─ payload_hash: SHA256(payload2)
└─ signature: Ed25519(canonical_data)
       │
       ▼ SHA256(Receipt2)
Receipt 3
├─ previous_receipt_hash: hash(Receipt2)
├─ payload_hash: SHA256(payload3)
└─ signature: Ed25519(canonical_data)
```

If any receipt is modified, the chain breaks at that point. Each agent maintains its own independent chain.

---

## Error Handling

| HTTP Status | Meaning | Action |
|-------------|---------|--------|
| 200 | Success | Check `valid` field for verification result |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Invalid or missing API key |
| 403 | Forbidden | Insufficient scope (e.g., free tier issuing) |
| 404 | Not Found | Receipt hash not in database |
| 413 | Payload Too Large | Exceeds 10KB limit |
| 422 | Validation Error | Missing required fields |
| 429 | Rate Limited | Tier quota exceeded |
| 500 | Server Error | Retry with exponential backoff |

### Common Errors

**Invalid API key:**
```json
{
  "error": {
    "code": "ERR_INVALID_API_KEY",
    "message": "Missing or invalid API key"
  }
}
```

**Insufficient scope (free tier trying to issue):**
```json
{
  "error": {
    "code": "ERR_INSUFFICIENT_SCOPE",
    "message": "Scope issue:write required. Upgrade to Explorer or Pro tier."
  }
}
```

**Invalid signature:**
```json
{
  "valid": false,
  "signature_ok": false,
  "reason": "Signature verification failed"
}
```

**Malformed receipt:**
```json
{
  "valid": false,
  "structure_ok": false,
  "reason": "Missing required field: payload_hash"
}
```

---

## Security Properties

| Property | Implementation |
|----------|----------------|
| **Authenticity** | Ed25519 asymmetric signature (third-party verifiable) |
| **Integrity** | SHA-256 per-agent hash chain |
| **Non-repudiation** | Ed25519 public key verification -- anyone can verify, no secrets required |
| **Privacy** | Only payload hash stored, actual message is never persisted |
| **Offline Verification** | Public key + receipt JSON = full verification without server access |

### Signing Algorithms

| Algorithm | Type | Third-Party Verification | Status |
|-----------|------|-------------------------|--------|
| **Ed25519** | Asymmetric | Yes (public key only) | **Primary** |
| **HMAC-SHA256** | Symmetric | No (requires server) | Legacy |

Ed25519 is the default for all new receipts. HMAC-SHA256 is supported for backwards compatibility.

---

## Pricing

| | Starter (Free) | Explorer ($59/mo) | Pro ($159/mo) | Enterprise |
|-|:---:|:---:|:---:|:---:|
| **Receipts/month** | 100 | 10,000 | 100,000 | Unlimited |
| **Verifications/month** | 500 | 50,000 | 500,000 | Unlimited |
| **Rate limit** | 60/min | 300/min | 1,000/min | Custom |
| **Scopes** | `verify:read` | `verify:read`, `issue:write` | All scopes | All scopes |
| **Hash chains** | -- | Yes | Yes | Yes |
| **Provenance DAG** | -- | Yes | Yes | Yes |
| **Counterfactuals** | -- | -- | Yes | Yes |
| **Key rotation** | Manual | Auto (90d) | Auto (custom) | Auto (custom) |
| **Priority support** | -- | -- | Yes | Yes |

**Start free with Starter. Scale to Explorer, Pro, or Enterprise when ready.**

---

## Further Reading

- [QUICKSTART.md](./QUICKSTART.md) -- 5-minute integration walkthrough
- [USER_MANUAL.md](./USER_MANUAL.md) -- Complete developer guide
- [TECHNICAL_MANUAL.md](./TECHNICAL_MANUAL.md) -- Deep cryptographic reference
- [INDEPENDENT_VERIFICATION.md](./INDEPENDENT_VERIFICATION.md) -- Offline chain & signature verification
- [examples/](../examples/) -- Working code examples (Python)
- [sdk/python/notary_sdk.py](../sdk/python/notary_sdk.py) -- Python SDK source
- [sdk/typescript/src/index.ts](../sdk/typescript/src/index.ts) -- TypeScript SDK source
- [sdk/go/notary/client.go](../sdk/go/notary/client.go) -- Go SDK source

---

*NotaryOS SDK Integration Guide v1.5.21 | notaryos.org*
