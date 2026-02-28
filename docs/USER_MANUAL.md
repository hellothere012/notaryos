# NotaryOS User Manual

**Version 1.5.21 | The Developer's Guide to Cryptographic Receipts**

---

## Welcome to NotaryOS

NotaryOS gives your AI agents cryptographic receipts. Every message between agents gets a **receipt** -- an immutable, signed proof of what was sent, by whom, and when. Think of it as a notarized receipt for every agent conversation.

This manual walks you through everything you need to integrate, operate, and troubleshoot NotaryOS in your applications.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Core Concepts](#2-core-concepts)
3. [Sealing Messages](#3-sealing-messages)
4. [Verifying Receipts](#4-verifying-receipts)
5. [Working with Hash Chains](#5-working-with-hash-chains)
6. [Provenance and Grounding](#6-provenance-and-grounding)
7. [Counterfactual Receipts](#7-counterfactual-receipts)
8. [SDK Reference](#8-sdk-reference)
9. [API Endpoints](#9-api-endpoints)
10. [Key Management](#10-key-management)
11. [Billing and Plans](#11-billing-and-plans)
12. [Monitoring and Diagnostics](#12-monitoring-and-diagnostics)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Getting Started

### Prerequisites

- Python 3.9+ or Node.js 18+
- An agent system that sends messages between AI agents
- (Optional) PostgreSQL and Redis for production deployments

### Install the SDK

**Python:**
```bash
pip install requests
```

**TypeScript (zero dependencies):**
```bash
# No installation needed -- uses native fetch() and crypto.subtle
```

### Your First Receipt in 30 Seconds

**Python:**
```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")
receipt = notary.issue("data_processing", {"message": "hello"})
result = notary.verify(receipt)
print(f"Valid: {result.valid}")        # Valid: True
print(f"Receipt: {receipt.receipt_id}")  # seal:a1b2c3d4
```

**TypeScript:**
```typescript
import { NotaryClient } from './index';

const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });
const receipt = await notary.issue('data_processing', { message: 'hello' });
const result = await notary.verify(receipt);
console.log(`Valid: ${result.valid}`);  // Valid: true
```

**Go:**
```go
client := notary.NewClient(os.Getenv("NOTARY_API_KEY"))
receipt, _ := client.Issue("data_processing", map[string]interface{}{"message": "hello"})
result, _ := client.Verify(receipt)
fmt.Printf("Valid: %v\n", result.Valid)
```

### Issue a Receipt for Your Agent

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")

# Issue a receipt for any action
receipt = notary.issue(
    "financial.transfer",
    {"message": "Transfer $500 to account XYZ", "amount": 500},
)

print(receipt.receipt_id)     # seal:f3a1...8b2c
print(receipt.agent_id)       # your-agent-id
print(receipt.action_type)    # financial.transfer
print(receipt.payload_hash)   # sha256 hash of payload
print(receipt.timestamp)      # 2026-02-12T08:49:00.123456+00:00
```

---

## 2. Core Concepts

### What is a Receipt?

A receipt is an immutable, cryptographically signed record. The SDK `Receipt` exposes these key fields:

| What it answers | SDK Field | Description |
|----------------|-----------|-------------|
| **Who performed the action?** | `agent_id` | The agent that performed the action |
| **What was done?** | `action_type` | Category of action (e.g., `financial.transfer`) |
| **What data was sent?** | `payload_hash` | SHA-256 of payload (privacy-preserving) |
| **When?** | `timestamp` | ISO 8601 UTC creation time |
| **Is it authentic?** | `signature`, `signature_type`, `key_id` | Cryptographic proof |
| **Where in the chain?** | `previous_receipt_hash` | Links to prior receipt |

> The SDK uses clean field names: `agent_id`, `action_type`, `payload_hash`. These are the only field names you need to know.

Once created, a receipt cannot be modified -- it is cryptographically sealed.

### What is a Badge?

A badge is a compact display format: `seal:a1b2...c3d4`. It shows the first 4 and last 4 hex characters of the receipt ID. Use it in logs, chat messages, and UI displays.

### What is the Hash Chain?

Every agent maintains its own chain of receipts. Each receipt links to the previous one via `previous_hash`. This creates an ordered, tamper-evident history per agent:

```
[Genesis] -> [Receipt 1] -> [Receipt 2] -> [Receipt 3] -> ...
```

If any receipt is modified, deleted, or reordered, the chain breaks and the tampering is immediately detectable.

### What is the Genesis Hash?

The first receipt in any agent's chain uses `previous_hash = "000...000"` (64 zeros). This is the genesis marker.

---

## 3. Sealing Messages

### Basic Seal

```python
receipt = await seal(
    {"message": "hello"},
    agent_id="my-agent",
    action_type="a2a.message",
)
```

### Seal with Custom Action Type

```python
receipt = await seal(
    {"ticker": "ACME", "action": "buy", "shares": 100},
    agent_id="trading-agent",
    action_type="trading.execute_order",
)
```

### Seal with Provenance References

When your receipt depends on upstream receipts:

```python
# This analysis depends on two prior data receipts
receipt = await seal(
    {"analysis": "Q4 earnings look strong"},
    agent_id="analyst-agent",
    action_type="financial.earnings_analysis",
    provenance_refs=["seal:abc12345", "seal:def67890"],
)
```

### Payload Types

`seal()` accepts three payload types:

| Type | Normalization |
|------|---------------|
| `dict` | `json.dumps(sort_keys=True, separators=(",",":"))` -- deterministic JSON |
| `str` | Encoded to UTF-8 bytes |
| `bytes` | Used directly |

The SHA-256 hash of the normalized bytes becomes the `payload_hash`.

### TypeScript seal()

```typescript
import { seal } from './notary_seal';

const receipt = await seal(
    { message: "hello", count: 42 },
    { agent_id: "my-agent", action_type: "a2a.message" }
);

console.log(receipt.badge);      // seal:a1b2...c3d4
console.log(receipt.signature);  // base64url-encoded Ed25519 signature
```

**Offline fallback:** If the API is unreachable, `seal()` produces an unsigned local receipt rather than throwing. Your agent flow continues. The receipt has `signature: "unsigned"` and `key_id: "local-offline"`.

---

## 4. Verifying Receipts

### Server-Side Verification

```python
notary = NotaryClient(api_key="notary_live_xxx")
result = notary.verify(receipt)

print(result.valid)         # True/False
print(result.signature_ok)  # Signature authentic?
print(result.structure_ok)  # All fields present?
print(result.chain_ok)      # Chain links correctly?
print(result.reason)        # Human-readable explanation
```

### Self-Verification (No Network)

Every receipt can verify itself:

```python
receipt = await seal({"msg": "hello"}, agent_id="a", action_type="a2a.message")
assert receipt.valid  # Checks signature locally
```

### Offline Verification with Public Key

You need only two things: the receipt JSON and the Ed25519 public key.

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
    receipt.get("action_type", "a2a.message"),
    receipt["payload_hash"],
    receipt.get("previous_receipt_hash", "0" * 64),
])

# Verify
sig_bytes = base64.urlsafe_b64decode(receipt["signature"] + "==")
public_key.verify(sig_bytes, canonical.encode("utf-8"))
# If no exception is raised, the receipt is authentic
```

> The SDK handles canonical format construction and verification internally. Use `NotaryClient.verify()` for receipt verification. See [INDEPENDENT_VERIFICATION.md](./INDEPENDENT_VERIFICATION.md) for detailed offline verification code.

### Chain Verification

Verify an entire agent's receipt history:

```python
# Verify each receipt in sequence
for i, receipt_dict in enumerate(receipts_list):
    result = notary.verify(receipt_dict)
    if not result.valid:
        print(f"Tampering at receipt {i}: {result.reason}")
        break
```

### Verify Unsigned Receipts

TypeScript SDK fast-rejects unsigned receipts without a network call:

```typescript
const result = await verify(unsignedReceipt);
// result.valid === false
// result.reason === "Receipt was created offline and is unsigned"
```

---

## 5. Working with Hash Chains

### Understanding Chain Links

Each receipt's `previous_hash` equals the preceding receipt's `payload_hash`:

```
Receipt #1: payload_hash = "abc123..."  previous_hash = "000...000" (genesis)
Receipt #2: payload_hash = "def456..."  previous_hash = "abc123..."
Receipt #3: payload_hash = "ghi789..."  previous_hash = "def456..."
```

### What the Chain Proves

- **Ordering**: Receipt #3 came after #2 (cryptographic, not just timestamps)
- **Completeness**: Missing a receipt creates a detectable gap
- **Integrity**: Modifying any receipt's payload changes its hash, breaking the next link
- **Non-repudiation**: Agent can't deny sending a message in its chain

### Chain per Agent

Each `agent_id` has its own independent chain. Agent A's chain doesn't affect Agent B's chain. This allows:

- Parallel sealing for different agents
- Independent verification of one agent's history
- No cross-agent bottlenecks

---

## 6. Provenance and Grounding

### What is Provenance?

When a receipt references upstream receipts via `provenance_refs`, it creates a dependency in the provenance DAG (Directed Acyclic Graph). This answers: "What data was this decision based on?"

### Grounding States

| State | Meaning | Action |
|-------|---------|--------|
| **GROUNDED** | All ancestors are valid | Normal operation |
| **UNGROUNDED** | Own signature OK, but an ancestor is invalid | Investigate upstream |
| **INVALID** | Own signature broken | Root cause of cascade |
| **UNKNOWN** | Can't determine (DB unavailable) | Retry later |

### Check Grounding

```python
# Grounding can be checked via the public API:
# GET /v1/notary/r/{hash}/provenance
# Or programmatically via SDK:
result = notary.lookup(receipt_hash)
status = result["verification"]["grounding_status"]  # grounded / ungrounded
if status == "grounded":
    print("Full provenance chain intact")
elif status == "ungrounded":
    print("An upstream receipt has been invalidated")
```

### Grounding Report

Get a full provenance analysis:

```bash
curl https://api.agenttownsquare.com/v1/notary/r/{hash}/provenance
```

Returns: status, is_root, depth, ancestors_checked, tainted_ancestors, intact_paths, broken_paths.

### Cascade Effects

When an admin invalidates a receipt, ALL downstream receipts that depend on it become UNGROUNDED. This cascade uses AND logic -- if any ancestor is invalid, the receipt is ungrounded.

---

## 7. Counterfactual Receipts

### What Are They?

Proof that an agent **could have** acted but **chose not to**. Standard receipts prove action. Counterfactual receipts prove deliberate non-action.

### When to Use

- Financial agent declined a trade (risk too high)
- Medical agent abstained from recommendation (uncertain)
- Compliance agent saw a pattern but confidence was insufficient

### Create a Counterfactual Receipt

```python
# Counterfactual receipts are created server-side via the API:
# POST /v1/notary/counterfactual/issue (requires API key with issue:write scope)
# Example payload:
proof = await seal_counterfactual(
    action_not_taken="financial.execute_trade",
    capability_proof={"permissions": ["trade.execute"], "account": "acme"},
    opportunity_context={"ticker": "ACME", "price": 142.50, "signal": "buy"},
    decision_reason="Risk score 0.87 exceeds threshold 0.75",
    agent_id="financial-agent",
    declination_reason="risk",
    validity_window_minutes=60,
)

print(proof.badge)                # cf:a1b2...c3d4  (note: "cf:" prefix)
print(proof.proofs_complete)      # True
print(proof.declination_reason)   # "risk"
```

### The Three Proofs

| Proof | What it proves |
|-------|---------------|
| **Capability** | Agent had permission and access |
| **Opportunity** | Conditions for action were present |
| **Decision** | Agent evaluated and deliberately declined |

### Declination Reasons

`POLICY`, `CAPACITY`, `CONFLICT`, `RISK`, `UNCERTAINTY`, `AUTHORIZATION`, `UNKNOWN`

### Verify a Counterfactual

```python
# Verify counterfactual via public API (no auth required):
# GET /v1/notary/counterfactual/r/{hash}
# Or via SDK:
result = notary.verify(proof)  # Works for both action and counterfactual receipts
print(result["valid"])               # True
print(result["signature_ok"])        # True
print(result["proofs_complete"])     # True
print(result["in_validity_window"])  # True (within 60 minutes)
```

---

## 8. SDK Reference

### Python SDK

**Source:** `sdk/python/notary_sdk.py` (zero external dependencies -- uses stdlib `urllib`)

**Constructor:**
```python
NotaryClient(api_key="notary_live_xxx", base_url=None, timeout=30, max_retries=2)
```

`api_key` is required. Keys must start with `notary_live_` or `notary_test_`.

**Methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `issue(action_type, payload)` | `Receipt` | Issue a signed receipt |
| `verify(receipt)` | `VerificationResult` | Verify receipt signature |
| `verify_by_id(receipt_id)` | `VerificationResult` | Verify by server-side lookup |
| `status()` | `ServiceStatus` | Service health check |
| `public_key()` | `dict` | Ed25519 public key (PEM) |
| `lookup(receipt_hash)` | `dict` | Public receipt lookup by hash |
| `me()` | `dict` | Agent info (tier, scopes, rate limits) |

**Convenience function:** `verify_receipt(receipt_dict)` -- quick verification without API key (public endpoint).

**Data Classes:** `Receipt`, `VerificationResult`, `ServiceStatus`

### TypeScript SDK

**Source:** `sdk/typescript/src/index.ts` (zero dependencies -- native `fetch()` and `crypto.subtle`)

**Constructor:**
```typescript
new NotaryClient({ apiKey, baseUrl, timeout, maxRetries })
```

**Methods:** Same as Python but camelCase (`publicKey()`, `verifyChain()`).

**Key difference:** `verifyChain()` uses `Promise.all()` for parallel verification.

**Runtime compatibility:** Node 18+, Deno, Bun, all modern browsers.

### Go SDK

**Source:** `sdk/go/notary/client.go` (standard library only)

**Constructor:**
```go
client := notary.NewClient(apiKey)
```

**Methods:** `Issue()`, `Verify()`, `Status()`, `PublicKey()`, `Lookup()`

### Error Handling

All SDKs share the same error hierarchy:

```
NotaryError                  // Base class
  AuthenticationError        // 401 -- invalid or missing API key
  RateLimitError             // 429 -- tier quota exceeded (has retry_after)
  ValidationError            // 422 -- missing fields or invalid format
```

Transient errors (5xx and 429) are retried automatically with exponential backoff.

---

## 9. API Endpoints

### Public (No Auth Required)

```bash
# Get a demo receipt
curl https://api.agenttownsquare.com/v1/notary/sample-receipt

# Verify a receipt
curl -X POST https://api.agenttownsquare.com/v1/notary/verify \
  -H "Content-Type: application/json" \
  -d '{"receipt": {...}}'

# Look up a receipt by hash
curl https://api.agenttownsquare.com/v1/notary/r/a1b2c3d4

# Get provenance report
curl https://api.agenttownsquare.com/v1/notary/r/a1b2c3d4/provenance

# Get public key for offline verification
curl https://api.agenttownsquare.com/v1/notary/public-key

# Health check
curl https://api.agenttownsquare.com/v1/notary/status

# JWKS endpoint
curl https://api.agenttownsquare.com/.well-known/jwks.json
```

### Authenticated (Bearer Token)

```bash
# Login first
TOKEN=$(curl -s -X POST https://api.agenttownsquare.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "you", "password": "pass"}' | jq -r '.access_token')

# Issue a receipt (via API key)
curl -X POST https://api.agenttownsquare.com/v1/notary/issue \
  -H "X-API-Key: notary_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"action_type": "data_processing", "payload": {"key": "value"}}'

# Get receipt history
curl -H "Authorization: Bearer $TOKEN" \
  https://api.agenttownsquare.com/v1/notary/history?limit=50

# Create API key
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://api.agenttownsquare.com/v1/api-keys \
  -H "Content-Type: application/json" \
  -d '{"name": "prod-key", "scopes": ["verify:read", "issue:write"]}'
```

---

## 10. Key Management

### Signing Algorithms

| Algorithm | Type | Third-Party Verification | Recommended For |
|-----------|------|-------------------------|-----------------|
| **Ed25519** | Asymmetric | Yes (public key only) | Production, multi-org |
| **HMAC-SHA256** | Symmetric | No (requires secret) | Single-org, development |

### Key Rotation

Keys rotate automatically every 90 days (configurable). During rotation:

1. New key becomes **Active** (used for new receipts)
2. Old key becomes **Retiring** (valid for verification for 24 hours)
3. After 24 hours, old key becomes **Revoked** (rejected)

Old receipts remain verifiable -- the `key_id` in each receipt maps to the correct key via JWKS.

### Manual Key Rotation

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://api.agenttownsquare.com/v1/notary/admin/rotate-key
```

### Getting the Public Key

```bash
# Direct endpoint
curl https://api.agenttownsquare.com/v1/notary/public-key

# JWKS endpoint (RFC 7517)
curl https://api.agenttownsquare.com/.well-known/jwks.json
```

---

## 11. Billing and Plans

### Tiers

| | Starter (Free) | Explorer ($59/mo) | Pro ($159/mo) | Enterprise |
|-|----------------|-------------------|----------------|------------|
| Receipts/month | 100 | 10,000 | 100,000 | Unlimited |
| Verifications/month | 500 | 50,000 | 500,000 | Unlimited |
| Rate limit | 60/min | 300/min | 1,000/min | Custom |
| Hash chains | -- | Yes | Yes | Yes |
| Provenance DAG | -- | Yes | Yes | Yes |
| Counterfactuals | -- | -- | Yes | Yes |

### Manage Your Subscription

```bash
# Check current status
curl -H "Authorization: Bearer $TOKEN" \
  https://api.agenttownsquare.com/v1/billing/status

# Upgrade via Stripe Checkout
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://api.agenttownsquare.com/v1/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"price_id": "price_xxx"}'

# Self-service portal (invoices, payment methods, cancellation)
curl -H "Authorization: Bearer $TOKEN" \
  https://api.agenttownsquare.com/v1/billing/portal
```

### Overage Policy

- **120% of quota**: Warning notification (requests continue)
- **200% of quota**: Requests blocked until next billing period or upgrade
- **Grace period**: 7 days after trial expiration

---

## 12. Monitoring and Diagnostics

### Health Check

```bash
curl https://api.agenttownsquare.com/v1/notary/status
```

Returns: service status, signer type, active agents, uptime.

### Operational Metrics

```bash
curl https://api.agenttownsquare.com/v1/notary/metrics
```

Returns: verification cache hit rate, abuse detector state, engine chain count, database row counts.

### Admin Statistics

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.agenttownsquare.com/v1/notary/admin/stats
```

Returns: total receipts issued, verifications, active agents, last 24h counts, average latencies.

### Auto-Receipt Middleware Status

The middleware exposes diagnostics via `stats` property: enabled, mode, fail_open, engine availability, circuit breaker state.

### Circuit Breaker

If seal latency averages over 200ms, the circuit breaker trips and skips sealing for 30 seconds. Check `X-Notary-Mode` response header for current state.

---

## 13. Troubleshooting

### Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| `ERR_INVALID_SIGNATURE` | Receipt tampered or wrong key | Check `key_id` matches the signing key; refresh JWKS cache |
| `ERR_CHAIN_BROKEN` | `previous_hash` mismatch | Receipt may have been deleted; check database consistency |
| `ERR_RATE_LIMIT_EXCEEDED` | Hit tier quota | Upgrade plan or wait for next billing period |
| Unsigned stamps | API unreachable | Check network; stamps can be re-sealed when connectivity restores |
| Agent suspended | High failure rate detected | Wait for auto-reinstatement; investigate verification failures |

### SDK Configuration Quick Reference

| Parameter | Default | Description |
|-----------|---------|-------------|
| `api_key` | (required) | Your API key (`notary_live_xxx` or `notary_test_xxx`) |
| `base_url` | `https://api.agenttownsquare.com` | API endpoint |
| `timeout` | `30` | Request timeout in seconds |
| `max_retries` | `2` | Retry attempts on transient failures |

For managed service configuration (signing keys, middleware, notifications), contact support@notaryos.org.

### Getting Help

- **API Docs:** [notaryos.org/api-docs](https://notaryos.org/api-docs)
- **Public Key:** `https://api.agenttownsquare.com/v1/notary/public-key`
- **Service Status:** `https://api.agenttownsquare.com/v1/notary/status`
- **GitHub Issues:** Report bugs and feature requests

---

*NotaryOS User Manual v1.5.21*
*Open-source cryptographic verification for AI agents*
