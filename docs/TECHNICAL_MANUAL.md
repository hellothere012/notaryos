# NotaryOS Technical Reference Manual

**Version 1.5.21 | Cryptographic Receipt System for AI Agent Accountability**

**Authors:** Agent Town Square

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. The Receipt: Anatomy](#2-the-receipt-anatomy)
- [3. Canonical Signing Format](#3-canonical-signing-format)
- [4. Signing Algorithms](#4-signing-algorithms)
- [5. Per-Agent Hash Chains](#5-per-agent-hash-chains)
- [6. Provenance DAG and Grounding](#6-provenance-dag-and-grounding)
- [7. Counterfactual Receipts](#7-counterfactual-receipts)
- [8. SDKs](#8-sdks)
- [9. HTTP API Reference](#9-http-api-reference)
- [10. Operational Components](#10-operational-components)
- [11. Data Model](#11-data-model)
- [12. Configuration](#12-configuration)
- [13. Security Model](#13-security-model)
- [14. Error Codes](#14-error-codes)
- [15. Pricing and Tiers](#15-pricing-and-tiers)
- [Appendix A: BNF Grammar](#appendix-a-bnf-grammar)
- [Appendix B: Open Source vs Managed Service Boundary](#appendix-b-open-source-vs-managed-service-boundary)
- [Appendix C: Migration Guide](#appendix-c-migration-guide)

---

## 1. System Overview

### 1.1 The Problem

AI agents execute thousands of autonomous decisions daily -- transferring funds, routing messages, analyzing reports, recommending treatments, escalating compliance alerts. They communicate through agent-to-agent protocols, orchestrating multi-step workflows that span organizations, jurisdictions, and trust boundaries. And they do all of this with **no audit trail**.

When something goes wrong:

- **What happened?** An agent claims it sent a confirmation, but the receiving agent says it never arrived. No proof exists.
- **In what order?** Two agents processed the same request concurrently with conflicting outcomes. Without cryptographic timestamps, ordering is reconstructed from mutable logs.
- **Was data tampered?** An agent made a recommendation based on upstream data. If that data was modified in transit, there is no way to prove the original content.
- **Did an agent choose NOT to act?** A financial agent declined a trade because risk exceeded its threshold. Six months later, during audit, the firm needs proof of deliberate restraint. Without a cryptographic record of non-action, that proof does not exist.

Log files are mutable. Databases can be edited. Timestamps can be backdated. None provide the three properties required for genuine accountability:

1. **Integrity** -- proof that content has not been modified since creation
2. **Authenticity** -- proof that content was created by a specific entity
3. **Non-repudiation** -- the creator cannot later deny having created it

### 1.2 The Solution: Cryptographic Receipts (Stamps)

NotaryOS provides cryptographic receipts for every agent-to-agent message, creating an immutable, verifiable, tamper-evident audit trail that any party can independently verify using only a public key.

The core primitive is the **Stamp** -- an immutable, cryptographically signed receipt containing the SHA-256 hash of the message payload, a signature from the signing authority, and a chain link to the previous receipt from the same agent. The API is deliberately minimal:

```python
# Python SDK
from notaryos import NotaryClient
notary = NotaryClient(api_key="notary_live_xxx")
receipt = notary.seal("my_action", {"message": "hello"})
print(receipt.badge)  # seal:a1b2...c3d4
```

```typescript
// TypeScript SDK
import { NotaryClient } from 'notaryos';
const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });
const receipt = await notary.issue('my_action', { message: "hello" });
console.log(receipt.badge); // seal:a1b2...c3d4
```

The `seal()` method (Python SDK) or `issue()` method (TypeScript SDK) handles payload hashing, chain linkage, and signing automatically, returning an immutable receipt in a single call.

### 1.3 Architecture: Razor and Blade

NotaryOS follows a **razor-and-blade** model. The open-source components (React UI, TypeScript/Python/Go SDKs) give full visibility into the cryptography. The managed signing service provides high-availability, key-managed, abuse-protected infrastructure that issues receipts at scale.

**You know exactly how the cryptography works. You can verify every receipt independently. The signing service is what you pay for.**

```
 OPEN SOURCE (You own this)                    MANAGED SERVICE (NotaryOS Backend)
 ============================                  ====================================

 React UI (NotaryOS)                           Receipt Engine
   - LandingPage, VerifyPanel                    - Receipt issuance
   - ChainVisualization                          - Per-agent hash chains
   - PublicVerifyPage                            - Ed25519 / HMAC-SHA256 signing
   - HistoryPage, PricingPage                    - JWKS key management

 TypeScript SDK                                Provenance & Integrity
   - issue() / verify()                          - Provenance DAG
   - Web Crypto API hashing                      - Counterfactual receipts
   - Offline fallback                            - Chain validation

 Python SDK                                    Infrastructure
   - HTTP client                                 - Abuse protection
   - Receipt verification                        - Rate limiting
   - Chain validation                            - Auto-receipt middleware
   - Auto-receipting (wrap/unwrap)
```

### 1.4 Glossary

| Term | Definition |
|------|-----------|
| **Stamp / Receipt** | Immutable cryptographic receipt with identity, integrity, authenticity, and provenance fields. The atomic unit of accountability. |
| **Seal / Issue** | The verb/action of creating a Receipt. Use `seal()` on the Python SDK or `issue()` on the TypeScript SDK. Both produce identical signed receipts. |
| **Badge** | Compact display format: `seal:a1b2...c3d4`. First 4 + last 4 hex chars of receipt ID. |
| **Hash Chain** | Per-agent linked list where each receipt's `previous_hash` references the preceding receipt's `payload_hash`. |
| **Genesis Hash** | `"0" * 64` -- the `previous_hash` for the first receipt in any agent's chain. |
| **Grounding** | Status indicating whether a receipt's entire provenance chain is intact: GROUNDED, UNGROUNDED, INVALID, or UNKNOWN. |
| **Counterfactual** | A receipt proving an agent COULD have acted but CHOSE NOT TO. Contains three additional proof hashes. |
| **Provenance DAG** | Directed acyclic graph of receipt dependencies created via `provenance_refs`. |
| **Receipt ID** | Format: `seal:{SHA256(seed)[:8]}`. Approximately 4 billion unique values (2^32). |
| **Canonical Format** | Deterministic representation of receipt fields used as signing input. Handled automatically by the SDKs. |

---

## 2. The Receipt: Anatomy

A **Receipt** is an immutable, cryptographically signed record. Once created, no field can be modified. The SDKs return a `Receipt` object with the following fields.

### 2.1 Field Reference

#### Identity Fields

| Field | Type | Description |
|-------|------|-------------|
| `receipt_id` | `str` | Unique identifier in the format `seal:{first8hex}`. Deterministically derived from receipt contents. |
| `agent_id` | `str` | The agent whose chain the receipt is appended to. |
| `action_type` | `str` | The action or capability name. Defaults to `"a2a.message"`. |

#### Integrity Fields

| Field | Type | Description |
|-------|------|-------------|
| `payload_hash` | `str` | SHA-256 hex digest of the normalized payload (64 hex chars). |
| `previous_hash` | `str` | Chain link to the previous receipt from the same agent. Genesis: 64 zero characters. |

#### Authenticity Fields

| Field | Type | Description |
|-------|------|-------------|
| `signature` | `str` | Cryptographic signature. Base64url for Ed25519, hex for HMAC-SHA256. |
| `signature_type` | `str` | Algorithm: `"ed25519"` or `"hmac-sha256"`. |
| `key_id` | `str` | Signing key identifier for rotation tracking. |

#### Temporal Field

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | `str` | ISO 8601 UTC creation time. |

#### Provenance Fields (v1.5.20)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `provenance_refs` | `list[str]` | `[]` | Receipt IDs this receipt depends on. Sorted and signed into the receipt. |
| `grounding_status` | `str` | `"grounded"` | Current state: `"grounded"`, `"ungrounded"`, `"invalid"`, `"unknown"`. |
| `receipt_type` | `str` | `"action"` | Discriminator: `"action"` or `"counterfactual"`. Prevents type repurposing attacks. |

#### Schema Evolution (v1.5.21)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `format_version` | `int` | `1` | Canonical format version. v1 is identical to pre-format_version era for backwards compatibility. |

### 2.2 Properties

**`badge`** -- Compact display: `seal:a1b2...c3d4` (first 4 + last 4 hex chars).

**`valid`** -- Self-verifying. Verifies signature locally using the public key. No network call required. Returns `False` on any error rather than raising.

### 2.3 Serialization

All SDKs support converting receipts to and from dictionaries and JSON:

- **`to_dict()`** / **`toJSON()`** -- Converts receipt to a plain dictionary/object for storage or transmission.
- **`from_dict(data)`** / **`fromJSON(data)`** -- Reconstructs a Receipt from a dictionary/object. Ignores unknown keys for forward compatibility.

---

## 3. Canonical Signing Format

The signing engine uses a deterministic canonical format internally to produce signatures. The format ensures that any receipt can be verified independently and that no serialization ambiguity exists.

### 3.1 Verification

For independent verification, the SDKs provide a `verify()` function that handles canonical format reconstruction automatically. You do not need to construct the canonical format yourself. See the SDK documentation for verification examples.

### 3.2 Format Versions

The current format version is **v1**. When provenance references are present, the format is extended to include them. The format version is tracked in the `format_version` field for future evolution.

### 3.3 Backwards Compatibility

Provenance fields are only appended when they differ from defaults. Receipts sealed before v1.5.20 produce identical canonical strings under new code. Signatures remain valid without re-signing.

### 3.4 Why Pipe-Delimited (Not JSON)

JSON has multiple valid representations of the same data. A pipe-delimited string with fixed field order eliminates all serialization ambiguity. Any language that can split on `|` can verify a receipt.

### 3.5 Security Properties

1. **No field injection** -- No field value contains the `|` character
2. **Deterministic ordering** -- Fixed positional fields
3. **Backwards compatible** -- `format_version=1` does not alter canonical string
4. **Type-safe separation** -- Action and counterfactual formats are structurally different
5. **Cross-language reproducible** -- Simple enough for any language

---

## 4. Signing Algorithms

### 4.1 Signing Interface

The signing subsystem supports two algorithms:

| Member | Description |
|--------|-------------|
| `signature_type` | Algorithm identifier: `"ed25519"` or `"hmac-sha256"` |
| `key_id` | Key identifier for rotation tracking |
| `public_key_pem` | PEM public key (Ed25519) or `None` (HMAC) |
| `sign(data: bytes)` | Returns `SignatureResult(signature, signature_type, key_id)` |
| `verify(data: bytes, signature: str)` | Returns `True`/`False`. Never raises. |

The signer is synchronous -- both HMAC and Ed25519 complete in <0.1ms.

### 4.2 Ed25519 (Primary)

**Specification:**

- **Asymmetric**: private key signs, public key verifies. Third-party verification without secret sharing.
- **Signature encoding**: Base64url (~86 chars for 64-byte signatures)
- **Key management**: Keys are configured via environment variables on the managed service. In production, explicit key configuration is required.
- **Production safety**: Raises error if no signing key is configured in production mode
- **Library**: `cryptography` (pyca/cryptography) -- most audited Python crypto library

### 4.3 HMAC-SHA256 (Legacy)

**Specification:**

- **Symmetric**: Same secret for signing and verification. Cannot share with third parties.
- **Signature encoding**: Hex (64 chars for 32-byte HMAC)
- **Timing-safe comparison**: Uses `hmac.compare_digest()` to prevent timing attacks
- **Use case**: Single-organization deployments where all verifiers are trusted

### 4.4 JWKS Integration

**Specification:**

Enables multi-key verification for key rotation:

1. New key published to JWKS as `"active"`
2. Old key status changed to `"retiring"` (verification only)
3. Receipts reference old `key_id` -- JWKS maps it to correct public key
4. After grace period: old key status becomes `"revoked"` (verification rejected)

Key states: `active` (sign+verify), `retiring` (verify only), `revoked` (rejected with error).

### 4.5 Unified Verification

The verification function auto-detects the algorithm from the `signature_type` field on the receipt. Unknown types return `False` (not an exception).

---

## 5. Per-Agent Hash Chains

### 5.1 Architecture

**Specification:**

Each agent maintains an independent linked list of receipts:

```
[Genesis: "000...000"]
       |
       v
[Receipt #1]  payload_hash = abc123...
              previous_hash = 000000...000000
       |
       v
[Receipt #2]  payload_hash = def456...
              previous_hash = abc123...
       |
       v
[Receipt #3]  payload_hash = ghi789...
              previous_hash = def456...
```

**What the chain proves:**
- **Ordering** -- cryptographic, not timestamp-based
- **Completeness** -- missing receipts create detectable gaps
- **Integrity** -- modified payloads break chain links
- **Non-repudiation** -- signature binds agent to receipt

### 5.2 Concurrency

The chain system ensures safe concurrent operation:

- Different agents can issue receipts in parallel
- Receipts from the same agent are serialized to prevent chain forks

### 5.3 Chain Warming

On restart, in-memory chain state is restored from persistent storage. The engine warms chain heads on demand (per-agent) or in bulk at startup. In-memory state always takes precedence over persistent state.

### 5.4 Chain Verification Pseudocode

```
function verify_chain(receipts, agent_id) -> bool:
    expected_previous = GENESIS_HASH
    for receipt in receipts:
        if receipt.agent_id != agent_id: return false
        if receipt.previous_hash != expected_previous: return false
        if not verify_signature(receipt): return false
        expected_previous = receipt.payload_hash
    return true
```

O(n) with one signature verification per receipt. Ed25519: ~0.1ms/receipt. 10,000 receipts: ~1 second.

---

## 6. Provenance DAG and Grounding


### 6.1 Grounding States

```python
class GroundingStatus(str, Enum):
    GROUNDED = "grounded"      # Entire provenance chain intact
    UNGROUNDED = "ungrounded"  # Signature valid but upstream invalidated
    UNKNOWN = "unknown"        # Cannot determine (DB unavailable)
    INVALID = "invalid"        # Receipt's own signature broken
```

**INVALID** = root cause (own signature failed). **UNGROUNDED** = tainted by association (own signature fine, ancestor invalid).

### 6.2 Hybrid Storage

- **Authoritative layer**: provenance refs signed INTO the receipt (immutable)
- **Derived layer**: Provenance edge storage for efficient traversal

**AND logic for diamond dependencies**: If ANY ancestor in ANY path is invalid, the receipt is ungrounded. Weakest-link model.

### 6.3 Cycle Detection: `validate_dag()`

Before storing provenance edges, DFS verifies no cycles exist:

1. Empty refs fast path: return valid
2. Self-reference check: immediate rejection
3. DFS from each ref through reverse edges, checking if path leads back to new receipt
4. Max depth safety limit (default 100): exceeding returns invalid

### 6.4 Grounding Check

The grounding check walks upward through the provenance DAG to determine whether all ancestors are valid:

1. Root receipts (no provenance refs) are always GROUNDED
2. Ancestors are checked for INVALID status
3. First tainted ancestor short-circuits the check (receipt is UNGROUNDED)
4. If the database is unavailable, the status is UNKNOWN

### 6.5 Cascade Propagation

When a receipt is invalidated, all downstream receipts that depend on it are automatically marked as UNGROUNDED. This cascade propagation:

1. Marks the source receipt as INVALID
2. Walks downward through all dependent receipts
3. Marks each dependent as UNGROUNDED (preserving any existing INVALID status on root causes)
4. Returns a cascade report listing all affected receipts, agents, and the propagation depth

### 6.6 Grounding Report

The grounding report API returns a full report with the complete DAG structure, suitable for API responses and visualization. See the `/v1/notary/r/{hash}/provenance` endpoint.

---

## 7. Counterfactual Receipts


### 7.1 Purpose

Proof that an agent COULD have acted but CHOSE NOT TO. Use cases:

- **Financial**: Agent declined trade due to risk score exceeding threshold
- **Medical**: Diagnostic agent flagged uncertainty, abstained from recommendation
- **Compliance**: Pattern detection agent evaluated but found insufficient confidence

### 7.2 Three Proofs

| Proof | Description | Hash |
|-------|-------------|------|
| **Capability** | Evidence agent had permission/access | `SHA-256(normalized_proof)` |
| **Opportunity** | Evidence conditions for action were present | `SHA-256(normalized_context)` |
| **Decision** | Human-readable explanation of declination | `SHA-256(reason.encode("utf-8"))` |

Combined: `message_hash = SHA-256("{cap_hash}|{opp_hash}|{dec_hash}")`

### 7.3 Type Discrimination

Counterfactual receipts use a distinct canonical format with a `"counterfactual"` prefix. This prevents type repurposing attacks — valid action signatures always fail against counterfactual format, and vice versa. The SDK handles format construction automatically during `issue_counterfactual()` calls.

### 7.4 DeclinationReason Enum

| Value | Meaning |
|-------|---------|
| `POLICY` | Organizational policy prevents action |
| `CAPACITY` | Agent at capacity or resource limit |
| `CONFLICT` | Conflict of interest detected |
| `RISK` | Risk assessment exceeds threshold |
| `UNCERTAINTY` | Insufficient confidence to act |
| `AUTHORIZATION` | Awaiting higher-level approval |
| `UNKNOWN` | Reason not categorized |

### 7.5 Validity Windows

Default: 60 minutes. The `in_validity_window` field is informational -- expired counterfactuals remain cryptographically valid. Operators decide whether temporal scope matters.

### 7.6 Code Example

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")

proof = notary.issue_counterfactual(
    action_not_taken="financial.execute_trade",
    capability_proof={"permissions": ["trade.execute"], "account": "acme"},
    opportunity_context={"ticker": "ACME", "price": 142.50, "signal": "buy"},
    decision_reason="Risk score 0.87 exceeds threshold 0.75",
    agent_id="financial-agent",
    declination_reason="risk",
    validity_window_minutes=60,
)

print(proof.valid)           # True
print(proof.proofs_complete) # True
print(proof.badge)           # cf:a1b2...c3d4

result = notary.verify(proof)
print(result.valid)          # True
```

---

## 8. SDKs

> **SDK Field Names:** The SDK `Receipt` object uses `agent_id`, `action_type`, and `payload_hash` to identify the acting agent, the action performed, and the hashed payload content.

### 8.1 Python SDK

**Source:** `sdk/python/notary_sdk.py` (open source, zero external dependencies -- uses stdlib `urllib`)

```python
from notaryos import NotaryClient, NotaryError, Receipt

notary = NotaryClient(api_key="notary_live_xxx")
receipt = notary.issue("data_processing", {"key": "value"})
result = notary.verify(receipt)
print(f"Valid: {result.valid}")
print(f"Agent: {receipt.agent_id}")
print(f"Hash: {receipt.payload_hash}")
```

**Constructor:** `NotaryClient(api_key, base_url=None, timeout=30, max_retries=2)` -- `api_key` is required (format: `notary_live_xxx` or `notary_test_xxx`).

**Methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `issue(action_type, payload)` | `Receipt` | Issue a signed receipt |
| `verify(receipt)` | `VerificationResult` | Verify receipt signature and integrity |
| `verify_by_id(receipt_id)` | `VerificationResult` | Verify by server-side lookup |
| `status()` | `ServiceStatus` | Service health check |
| `public_key()` | `dict` | Ed25519 public key (PEM) |
| `lookup(receipt_hash)` | `dict` | Public receipt lookup by hash |
| `me()` | `dict` | Authenticated agent info (tier, scopes) |

**Data Classes:** `Receipt`, `VerificationResult`, `ServiceStatus`

**Exceptions:** `NotaryError` > `AuthenticationError`, `RateLimitError`, `ValidationError`

Retry: exponential backoff (2^attempt seconds), 2 attempts, status codes 500+ and 429.

### 8.2 TypeScript SDK

**Source:** `sdk/typescript/src/index.ts` (open source, zero external dependencies -- uses native `fetch()` and `crypto.subtle`)

```typescript
import { NotaryClient } from './index';

const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });
const receipt = await notary.issue('data_processing', { key: 'value' });
const result = await notary.verify(receipt);
console.log(`Valid: ${result.valid}`);
console.log(`Agent: ${receipt.agent_id}`);
```

Compatible with Node 18+, Deno, Bun, all modern browsers.

**Key difference:** `verifyChain()` fires all verification requests in parallel via `Promise.all()`.

### 8.3 Go SDK

**Source:** `sdk/go/notary/client.go` (open source, standard library only)

```go
client := notary.NewClient(os.Getenv("NOTARY_API_KEY"))
receipt, _ := client.Issue("data_processing", map[string]interface{}{"key": "value"})
result, _ := client.Verify(receipt)
fmt.Printf("Valid: %v, Agent: %s\n", result.Valid, receipt.AgentID)
```

### 8.4 High-Level issue() / seal() API

The SDKs provide a single-call API for issuing and verifying receipts:

```typescript
import { NotaryClient } from 'notaryos';

const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });
const receipt = await notary.issue('my_action', { message: "hello" });
console.log(receipt.badge);  // seal:a1b2...c3d4

const result = await notary.verify(receipt);
console.log(result.valid);  // true
```

**Offline fallback:** If the API is unreachable, the SDK produces an unsigned local receipt (`signature: "unsigned"`, `key_id: "local-offline"`). Message flow is never blocked.

> For all integrations, use `NotaryClient.issue()` with public field names (`agent_id`, `action_type`).

---

## 9. HTTP API Reference

**Base URL:** `https://api.agenttownsquare.com`

### 9.1 Public Endpoints (No Auth)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/notary/verify` | Verify receipt signature and structure |
| `GET` | `/v1/notary/r/{hash}` | Public receipt lookup by hash |
| `GET` | `/v1/notary/r/{hash}/provenance` | Full provenance DAG report |
| `GET` | `/v1/notary/sample-receipt` | Live signed demo receipt |
| `GET` | `/v1/notary/status` | Service health check |
| `GET` | `/v1/notary/metrics` | Operational statistics |
| `GET` | `/v1/notary/public-key` | Ed25519 public key (PEM) |
| `GET` | `/v1/notary/counterfactual/r/{hash}` | Verify counterfactual receipt |
| `GET` | `/.well-known/jwks.json` | RFC 7517 JWKS (all non-revoked keys) |
| `GET` | `/notary/keys/current` | Current active signing key metadata |
| `GET` | `/notary/keys/{kid}` | Specific key by Key ID |

### 9.2 Authenticated Endpoints (Bearer Token)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/notary/seal` | Create signed receipt |
| `GET` | `/v1/notary/history` | Receipt history (paginated) |
| `POST` | `/v1/api-keys` | Create API key |
| `DELETE` | `/v1/api-keys/{id}` | Revoke API key |
| `POST` | `/v1/api-keys/{id}/rotate` | Rotate API key |

### 9.3 Agent-Authenticated Endpoints (API Key)

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| `POST` | `/v1/notary/agents/register` | (self-reg) | Register agent, get API key |
| `POST` | `/v1/notary/issue` | `issue:write` | Issue signed receipt |
| `GET` | `/v1/notary/agents/me` | any | Agent info |
| `POST` | `/v1/notary/counterfactual/issue` | `issue:write` | Issue counterfactual receipt |

### 9.4 Admin Endpoints (JWT + Admin Role)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/notary/admin/signer` | Current signer config |
| `POST` | `/v1/notary/admin/rotate-key` | Trigger key rotation |
| `GET` | `/v1/notary/admin/stats` | System-wide statistics |
| `POST` | `/v1/notary/admin/invalidate/{hash}` | Invalidate receipt + cascade |
| `POST` | `/notary/keys/{kid}/revoke` | Revoke compromised key |

### 9.5 Billing Endpoints (Stripe)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/billing/create-checkout-session` | Start Stripe Checkout |
| `GET` | `/v1/billing/portal` | Stripe Billing Portal URL |
| `GET` | `/v1/billing/status` | Current tier and usage |
| `GET` | `/v1/billing/subscription` | Detailed subscription info |
| `POST` | `/webhooks/stripe` | Stripe webhook receiver |

### 9.6 Stripe Webhook Events

| Event | Action |
|-------|--------|
| `customer.subscription.created` | Activate tier, set rate limits |
| `customer.subscription.updated` | Update tier on upgrade/downgrade |
| `customer.subscription.deleted` | Downgrade to free tier |
| `checkout.session.completed` | Link subscription to user |
| `invoice.payment_succeeded` | Record payment |
| `invoice.payment_failed` | Record failure, notify user |

---

## 10. Operational Components

### 10.1 Auto-Receipt Middleware

Automatically generates receipts for every A2A message without adding response latency.

**Operating Modes:**

| Mode | Behavior |
|------|----------|
| `shadow` (default) | Generate receipts, log at DEBUG. No response modification. |
| `opt-in` | Attach headers only when `X-Notary-Enable: true` in request. |
| `active` | Always attach receipt headers to 2xx responses. |

**Design principles:** Non-blocking (receipt issuance never adds latency to responses), fail-open (exceptions never block A2A communication).

**Response Headers (active/opt-in mode):**

| Header | Description |
|--------|-------------|
| `X-Notary-Mode` | Current mode |
| `X-Notary-Receipt-Id` | Receipt badge |
| `X-Notary-Seal` | Seal value |
| `X-Notary-Chain` | Agent ID + chain sequence |

### 10.2 Circuit Breaker

Latency-based circuit breaker for the receipt issuance pipeline.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `threshold_ms` | `200.0` | Rolling average that triggers trip |
| `window_size` | `10` | Sliding window samples |
| `cooldown_seconds` | `30.0` | Duration before auto-reset |

State machine: CLOSED (normal) -> OPEN (skip seals) -> auto-reset after cooldown.

### 10.3 Abuse Detection

Per-agent verification pattern monitoring with sliding window analysis.

**Thresholds:**

| Threshold | Default | Action |
|-----------|---------|--------|
| Failure rate suspend | 50% | Auto-suspend agent |
| Failure rate warning | 25% | Emit warning event |
| Sliding window | 3600s (1 hour) | Time span for rate calc |
| Min requests | 10 | Before evaluation |
| Max consecutive failures | 20 | Immediate suspend |
| Cooldown | 30 minutes | Auto-reinstate |

**AbuseAction values:** `NONE`, `WARNING`, `SUSPEND`, `REINSTATE`

### 10.4 Telegram Notifications

Sends formatted receipt summaries to Telegram for real-time monitoring.

**Modes:** `all`, `human_facing` (default), `errors_only`, `off`

All methods are designed to never raise. HTTP call uses 5-second timeout. Failures are logged and return `False`.

---

## 11. Data Model

The NotaryOS backend uses a relational database to store receipts, chain state, provenance edges, and counterfactual records. The schema is managed internally and is not part of the public SDK surface.

**Key concepts:**
- Receipts are stored with their cryptographic signature and chain position
- Per-agent chain state tracks the head of each agent's hash chain
- Provenance edges link receipts in a directed acyclic graph (DAG)
- Counterfactual records store proof-of-non-action with the same signature guarantees

For schema details relevant to self-hosting or enterprise deployments, contact support@notaryos.org.

---

## 12. Configuration

### 12.1 SDK Configuration

The SDKs are configured via constructor parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `api_key` | (required) | Your API key (`notary_live_xxx` or `notary_test_xxx`) |
| `base_url` | `https://api.agenttownsquare.com` | API endpoint |
| `timeout` | `30` | Request timeout in seconds |
| `max_retries` | `2` | Retry attempts on transient failures |

### 12.2 Auto-Receipt Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `mode` | `"all"` | `"all"`, `"errors_only"`, or `"sample"` |
| `sample_rate` | `1.0` | Sampling rate for `"sample"` mode (0.0-1.0) |
| `fire_and_forget` | `True` | Non-blocking receipt issuance |
| `dry_run` | `False` | Log payloads without issuing |
| `redact_secrets` | `True` | Redact sensitive argument names |

### 12.3 Service Level Objectives

| Metric | Target | Verified (Production) |
|--------|--------|-----------------------|
| Uptime | 99.9% | 29 days continuous |
| Issue P50 latency | <15ms | **3.56ms** |
| Verify P50 latency | <5ms | **4.70ms** |
| Verify P99 latency | <50ms | **9.56ms** |
| Throughput (single-thread) | >100 RPS | **178+ receipts/sec** |
| Success Rate | 100% | **100%** (5,416 requests) |

> **Benchmark environment:** DigitalOcean droplet — 4 vCPU, 8 GB RAM, 8 Uvicorn workers. Full report: `reports/NOTARYOS_ENTERPRISE_BENCHMARK_20260214.md`.

Backend configuration, key management, and infrastructure details are managed internally. For enterprise self-hosting configuration, contact support@notaryos.org.

---

## 13. Security Model

### 13.1 Threat Model

| Threat | Attack | Defense | Property |
|--------|--------|---------|----------|
| **Forge** | Fabricate signature | Ed25519 asymmetric signing (1 in 2^128) | Authenticity |
| **Repurpose** | Swap fields, preserve signature | Canonical format signs ALL fields | Integrity |
| **Reorder** | Change receipt sequence | Per-agent hash chain linkage | Ordering |
| **Deny** | Claim never sent message | Non-repudiation via Ed25519 + public key | Non-repudiation |

### 13.2 Cryptographic Walkthrough

1. **Payload normalization**: Payload is serialized to deterministic bytes (sorted keys, no whitespace)
2. **SHA-256 hash**: 64-char hex digest of payload bytes
3. **Chain linkage**: Previous receipt hash is retrieved for the agent's chain (genesis hash for first receipt)
4. **Receipt ID generation**: Deterministic ID derived from receipt contents
5. **Canonical format**: Fields assembled in deterministic order for signing
6. **Ed25519 signing**: 64-byte deterministic signature, base64url-encoded
7. **Verification**: Reconstruct canonical format, verify signature with public key. Completely offline -- no API call required.

### 13.3 Key Management Lifecycle

```
[Generated] --> [Active] --> [Retiring] --> [Revoked]
                   ^              |
                   | 24-hour      |
                   | overlap      |
                   +-- period ----+
```

| State | Can Sign | Can Verify |
|-------|----------|------------|
| Active | Yes | Yes |
| Retiring | No | Yes |
| Revoked | No | No (raises ValueError) |

Timeline: Active 90 days -> Warning at day 76 -> Rotation at day 90 -> 24h overlap -> Revoke at day 91. Max key age: 180 days (forced rotation).

### 13.4 Offline Verification

Verification requires exactly two inputs: the receipt JSON and the public key.

No server. No API key. No private key. No trust in the verifier.

This is the economic engine: signing is paid, verification is free and unlimited.

---

## 14. Error Codes

### Client Errors (4xx)

| Code | HTTP | Cause |
|------|------|-------|
| `ERR_RECEIPT_NOT_FOUND` | 404 | Receipt hash not in database |
| `ERR_INVALID_SIGNATURE` | 400 | Signature verification failed |
| `ERR_INVALID_STRUCTURE` | 400 | Missing required fields |
| `ERR_UNKNOWN_SIGNER` | 400 | `key_id` not in JWKS |
| `ERR_CHAIN_BROKEN` | 400 | `previous_hash` mismatch |
| `ERR_PAYLOAD_TOO_LARGE` | 413 | Exceeds 10KB limit |
| `ERR_RATE_LIMIT_EXCEEDED` | 429 | Tier limit exceeded |
| `ERR_INVALID_API_KEY` | 401 | Missing/expired API key |
| `ERR_INSUFFICIENT_SCOPE` | 403 | Key lacks required scope |

### Server Errors (5xx)

| Code | HTTP | Cause |
|------|------|-------|
| `ERR_INTERNAL_ERROR` | 500 | Unexpected exception |
| `ERR_DATABASE_ERROR` | 500 | PostgreSQL failure |
| `ERR_SIGNING_ERROR` | 500 | Signing key unavailable |

---

## 15. Pricing and Tiers

| Feature | Starter ($0/mo) | Explorer ($59/mo) | Pro ($159/mo) | Enterprise |
|---------|:---:|:---:|:---:|:---:|
| Receipts/month | 100 | 10,000 | 100,000 | Unlimited |
| Verifications/month | 500 | 50,000 | 500,000 | Unlimited |
| Rate limit | 60 req/min | 300 req/min | 1,000 req/min | Custom |
| Ed25519 signatures | Yes | Yes | Yes | Yes |
| SDKs (Python/TS/Go) | Yes | Yes | Yes | Yes |
| Public key & JWKS | Yes | Yes | Yes | Yes |
| Hash chain linking | -- | Yes | Yes | Yes |
| Provenance DAG | -- | Yes | Yes | Yes |
| Counterfactual receipts | -- | -- | Yes | Yes |
| Webhook notifications | -- | Yes | Yes | Yes |
| Telegram notifications | -- | Yes | Yes | Yes |
| Priority support | -- | -- | Yes | Yes |
| Key rotation | Manual | Auto (90d) | Auto (custom) | Auto (custom) |

**Overage:** Soft limit at 120% (warning), hard limit at 200% (blocked). 7-day grace period for new accounts.

**SLOs:** 99.9% uptime, seal P50 3.56ms (verified), verify P50 4.70ms (verified). Benchmarked on 4 vCPU / 8 GB RAM / 8 workers — see `reports/NOTARYOS_ENTERPRISE_BENCHMARK_20260214.md`.

---

## Appendix A: BNF Grammar

### Action Receipt Canonical Format

```bnf
<canonical-v1> ::= <base-fields> | <base-fields> "|" <provenance-fields>
<base-fields>  ::= <receipt-id> "|" <timestamp> "|" <from-agent> "|"
                    <to-agent> "|" <capability> "|" <message-hash> "|" <previous-hash>
<provenance-fields> ::= <refs-string> "|" <receipt-type>
<receipt-id>   ::= "seal:" <hex8>
<genesis-hash> ::= "0"{64}
<refs-string>  ::= "" | <receipt-id> ("," <receipt-id>)*
<receipt-type> ::= "action" | "counterfactual"
```

### Counterfactual Canonical Format

```bnf
<counterfactual-canonical> ::= "counterfactual" "|" <receipt-id> "|" <timestamp> "|"
                                <from-agent> "|" <to-agent> "|" <capability> "|"
                                <message-hash> "|" <previous-hash> "|" <refs-string> "|"
                                <action-not-taken> "|" <capability-hash> "|"
                                <opportunity-hash> "|" <decision-hash>
```

---

## Appendix B: Open Source vs Managed Service Boundary

### Open Source (You Own This)

| Component | Location |
|-----------|----------|
| React Verification UI | `ui/` |
| TypeScript SDK | `sdk/typescript/` |
| Python SDK | `sdk/python/` |
| Go SDK | `sdk/go/` |
| DB Migrations | `migrations/` |
| Configuration | `config/` |
| Code Examples | `examples/` |

### Managed Service (NotaryOS Backend)

| Component | Description |
|-----------|-------------|
| Receipt Issuance | High-availability receipt creation and signing |
| Signing Service | Ed25519 and HMAC-SHA256 key-managed signing |
| Provenance DAG | Graph construction and grounding validation |
| Counterfactual Receipts | Proof-of-non-action issuance |
| Abuse Protection | Rate pattern analysis and anomaly detection |
| Notifications | Real-time receipt alerts (Telegram, webhooks) |
| Auto-Receipting | Transparent receipt generation for A2A messages |
| REST API | Receipt operations, JWKS, and key management |
| Billing | Stripe metering and subscription management |

---

## Appendix C: Migration Guide

SDK updates are backward-compatible. Update your SDK to the latest version:

```bash
pip install --upgrade notaryos    # Python
npm update notaryos               # TypeScript
go get -u github.com/hellothere012/notaryos-go  # Go
```

Existing code works unchanged. New features (provenance references, counterfactual receipts, auto-receipting) become available after the update.

For managed service migrations and self-hosting upgrades, contact support@notaryos.org.

---

*NotaryOS Technical Reference Manual v1.5.21*
*Open-source cryptographic verification for AI agents*
