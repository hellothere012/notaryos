# NotaryOS Technical Reference Manual

**Version 1.5.21 | Cryptographic Receipt System for AI Agent Accountability**

**Authors:** Agent Town Square

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. The Stamp: Receipt Anatomy](#2-the-stamp-receipt-anatomy)
- [3. Canonical Signing Format](#3-canonical-signing-format)
- [4. Signing Algorithms](#4-signing-algorithms)
- [5. Per-Agent Hash Chains](#5-per-agent-hash-chains)
- [6. Provenance DAG and Grounding](#6-provenance-dag-and-grounding)
- [7. Counterfactual Receipts](#7-counterfactual-receipts)
- [8. SDKs](#8-sdks)
- [9. HTTP API Reference](#9-http-api-reference)
- [10. Operational Components](#10-operational-components)
- [11. Database Schema](#11-database-schema)
- [12. Configuration Reference](#12-configuration-reference)
- [13. Security Model](#13-security-model)
- [14. Error Codes](#14-error-codes)
- [15. Pricing and Tiers](#15-pricing-and-tiers)
- [Appendix A: BNF Grammar](#appendix-a-bnf-grammar)
- [Appendix B: Open Source vs Proprietary Boundary](#appendix-b-open-source-vs-proprietary-boundary)
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
# Server-side (engine internals — not included in open-source SDK)
receipt = await seal({"message": "hello"}, from_agent="my-agent", to_agent="target")
print(receipt.badge)  # seal:a1b2...c3d4
```

```python
# Client-side (using the open-source SDK)
from notaryos import NotaryClient
notary = NotaryClient(api_key="notary_live_xxx")
receipt = notary.issue("my_action", {"message": "hello"})
```

```typescript
import { seal } from './notary_seal';
const stamp = await seal({ message: "hello" }, { from_agent: "my-agent", to_agent: "target" });
console.log(stamp.badge); // seal:a1b2...c3d4
```

The `seal()` function performs six operations:

1. Normalizes the payload to bytes and computes its SHA-256 hash
2. Looks up the previous hash from this agent's chain (genesis if first)
3. Generates a unique receipt ID from the canonical data hash
4. Signs the canonical data string with Ed25519 or HMAC-SHA256
5. Updates the per-agent chain state
6. Returns an immutable Stamp

### 1.3 Architecture: Razor and Blade

NotaryOS follows a **razor-and-blade** model. The open-source components (React UI, TypeScript/Python SDKs, migration scripts) give full visibility into the cryptography. The managed signing service provides high-availability, key-managed, abuse-protected infrastructure that issues receipts at scale.

**You know exactly how the cryptography works. You can verify every receipt independently. The signing service is what you pay for.**

```
 OPEN SOURCE (You own this)                    MANAGED SERVICE (NotaryOS Backend)
 ============================                  ====================================

 React UI (NotaryOS)                           NotaryEngine (seal.py)
   - LandingPage, VerifyPanel                    - seal() verb
   - ChainVisualization                          - Per-agent hash chains
   - PublicVerifyPage                            - Chain warming
   - HistoryPage, PricingPage                    - Singleton engine

 TypeScript SDK                                ReceiptSigner (receipt_signer.py)
   - seal() / verify()                           - Ed25519 (primary)
   - Web Crypto API hashing                      - HMAC-SHA256 (legacy)
   - Offline fallback                            - JWKS key lookup & rotation

 Python SDK                                    Grounding DAG (grounding.py)
   - HTTP client                                 - Cycle detection (DFS)
   - Receipt verification                        - Grounding check (BFS)
   - Chain validation                            - Cascade propagation
                                                 - Provenance reports
 DB Migration Scripts
   - notary_action_receipts                    Counterfactual (counterfactual.py)
   - notary_agent_state                          - Proof of non-action
   - notary_provenance_edges                     - 3-proof architecture
                                                 - Validity windows

                                               Abuse Detector (abuse_detector.py)
                                                 - Sliding window rates
                                                 - Auto-suspend / reinstate

                                               Auto-Receipt Middleware
                                                 - Transparent sealing
                                                 - Circuit breaker
                                                 - Rate limiting
```

### 1.4 Glossary

| Term | Definition |
|------|-----------|
| **Stamp** | Immutable frozen dataclass with 14 fields representing a cryptographic receipt. The atomic unit of accountability. |
| **Seal** | The verb/action of creating a Stamp. The `seal()` function is the primary API surface. |
| **Badge** | Compact display format: `seal:a1b2...c3d4`. First 4 + last 4 hex chars of receipt ID. |
| **Hash Chain** | Per-agent linked list where each receipt's `previous_hash` references the preceding receipt's `message_hash`. |
| **Genesis Hash** | `"0" * 64` -- the `previous_hash` for the first receipt in any agent's chain. |
| **Grounding** | Status indicating whether a receipt's entire provenance chain is intact: GROUNDED, UNGROUNDED, INVALID, or UNKNOWN. |
| **Counterfactual** | A receipt proving an agent COULD have acted but CHOSE NOT TO. Contains three additional proof hashes. |
| **Provenance DAG** | Directed acyclic graph of receipt dependencies created via `provenance_refs`. |
| **Receipt ID** | Format: `seal:{SHA256(seed)[:8]}`. Approximately 4 billion unique values (2^32). |
| **Canonical Format** | Pipe-delimited deterministic string of receipt fields used as signing input. |

---

## 2. The Stamp: Receipt Anatomy

**Source:** NotaryOS Engine (proprietary)

The `Stamp` is implemented as a Python frozen dataclass (`@dataclass(frozen=True)`). Once instantiated, no field can be modified -- the Python runtime enforces this.

### 2.1 Field Reference

#### Identity Fields

| Field | Type | Description |
|-------|------|-------------|
| `receipt_id` | `str` | Unique identifier: `seal:{first8hex}`. Deterministic from `SHA-256(timestamp\|from_agent\|message_hash\|previous_hash)`. |
| `from_agent` | `str` | Sending agent whose chain the receipt is appended to. |
| `to_agent` | `str` | Receiving agent. For counterfactuals: `"notary"`. |
| `capability` | `str` | A2A capability name. Defaults to `"a2a.message"`. |

#### Integrity Fields

| Field | Type | Description |
|-------|------|-------------|
| `message_hash` | `str` | SHA-256 hex digest of normalized payload (64 hex chars). |
| `previous_hash` | `str` | Chain link to previous receipt from same `from_agent`. Genesis: `"0" * 64`. |

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
| `provenance_refs` | `Tuple[str, ...]` | `()` | Receipt IDs this receipt depends on. Sorted and signed into canonical format. |
| `grounding_status` | `str` | `"grounded"` | Current state: `"grounded"`, `"ungrounded"`, `"invalid"`, `"unknown"`. |
| `receipt_type` | `str` | `"action"` | Discriminator: `"action"` or `"counterfactual"`. Prevents type repurposing attacks. |

#### Schema Evolution (v1.5.21)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `format_version` | `int` | `1` | Canonical format version. v1 is identical to pre-format_version era for backwards compatibility. |

### 2.2 Properties

**`badge`** -- Compact display: `seal:a1b2...c3d4` (first 4 + last 4 hex chars).

**`valid`** -- Self-verifying. Reconstructs canonical string, verifies signature locally. No network call required. Returns `False` on any error rather than raising.

**`__str__`** -- Human-readable: `[seal:f3a18b2c] financial-agent -> dashboard (financial.earnings_analysis) @ 2026-02-11T12:00:00Z v1`.

### 2.3 Serialization

- **`to_dict()`** -- Converts to plain dict via `dataclasses.asdict()`. `provenance_refs` tuple becomes list for JSON compatibility.
- **`to_json(indent=None)`** -- JSON string with `sort_keys=True` for deterministic output.
- **`from_dict(data)`** -- Reconstructs Stamp from dict. Ignores unknown keys for forward compatibility.

---

## 3. Canonical Signing Format

**Source:** `seal.py` lines 641-701

The canonical format is the contract between signing and verification. It is a pipe-delimited string of receipt fields in fixed, deterministic order.

### 3.1 Format v1 (Base Case)

When `provenance_refs` is empty and `receipt_type` is `"action"`:

```
receipt_id|timestamp|from_agent|to_agent|capability|message_hash|previous_hash
```

7-field pipe-delimited string.

### 3.2 Format v1 with Provenance

When `provenance_refs` is non-empty OR `receipt_type` is not `"action"`:

```
receipt_id|timestamp|from_agent|to_agent|capability|message_hash|previous_hash|sorted_refs|receipt_type
```

9-field string. `sorted_refs` is comma-separated, alphabetically sorted.

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

**Source:** NotaryOS Signing Engine (proprietary)

### 4.1 ReceiptSigner Interface

All signing flows through an abstract base class (lines 70-124):

| Member | Description |
|--------|-------------|
| `signature_type` | Algorithm identifier: `"ed25519"` or `"hmac-sha256"` |
| `key_id` | Key identifier for rotation tracking |
| `public_key_pem` | PEM public key (Ed25519) or `None` (HMAC) |
| `sign(data: bytes)` | Returns `SignatureResult(signature, signature_type, key_id)` |
| `verify(data: bytes, signature: str)` | Returns `True`/`False`. Never raises. |

The signer is synchronous -- both HMAC and Ed25519 complete in <0.1ms.

### 4.2 Ed25519 (Primary)

**Source:** `receipt_signer.py` lines 197-366

- **Asymmetric**: private key signs, public key verifies. Third-party verification without secret sharing.
- **Signature encoding**: Base64url (~86 chars for 64-byte signatures)
- **Key loading priority**: `ED25519_SIGNING_KEY` env > `CAPABILITY_PRIVATE_KEY` env > auto-generate (dev only)
- **Production safety**: Raises `RuntimeError` if no key configured in production
- **Library**: `cryptography` (pyca/cryptography) -- most audited Python crypto library

### 4.3 HMAC-SHA256 (Legacy)

**Source:** `receipt_signer.py` lines 132-189

- **Symmetric**: Same secret for signing and verification. Cannot share with third parties.
- **Signature encoding**: Hex (64 chars for 32-byte HMAC)
- **Timing-safe comparison**: Uses `hmac.compare_digest()` to prevent timing attacks
- **Use case**: Single-organization deployments where all verifiers are trusted

### 4.4 JWKS Integration

**Source:** `receipt_signer.py` lines 504-633

Enables multi-key verification for key rotation:

1. New key published to JWKS as `"active"`
2. Old key status changed to `"retiring"` (verification only)
3. Receipts reference old `key_id` -- JWKS maps it to correct public key
4. After grace period: old key status becomes `"revoked"` (verification rejected)

Key states: `active` (sign+verify), `retiring` (verify only), `revoked` (rejected with error).

### 4.5 Unified Verification

`verify_signature()` (lines 470-501) auto-detects algorithm from `signature_type` field. Unknown types return `False` (not an exception). Both signer types are lazily initialized as module-level singletons.

---

## 5. Per-Agent Hash Chains

### 5.1 Architecture

**Source:** `seal.py` line 287

Each `from_agent` maintains an independent linked list:

```
[Genesis: "000...000"]
       |
       v
[Receipt #1]  message_hash = abc123...
              previous_hash = 000000...000000
       |
       v
[Receipt #2]  message_hash = def456...
              previous_hash = abc123...
       |
       v
[Receipt #3]  message_hash = ghi789...
              previous_hash = def456...
```

**What the chain proves:**
- **Ordering** -- cryptographic, not timestamp-based
- **Completeness** -- missing receipts create detectable gaps
- **Integrity** -- modified payloads break chain links
- **Non-repudiation** -- signature binds agent to receipt

### 5.2 Thread Safety

Per-agent `asyncio.Lock` with double-checked locking pattern (lines 303-326):

- Different agents seal in parallel
- Same agent serialized (prevents chain forks)
- Meta-lock only contended on first seal per agent

### 5.3 Chain Warming

On restart, in-memory chain state is lost. Two warming functions restore it:

- **`warm_chain(agent_id, chain_head)`** -- single agent, called by `/issue` endpoint
- **`warm_chains_from_db(db_pool)`** -- bulk load from `notary_agent_state` table at startup

Both only set chain head if agent is NOT already tracked in memory (in-memory is always more recent).

### 5.4 Chain Verification Pseudocode

```
function verify_chain(receipts, agent_id) -> bool:
    expected_previous = GENESIS_HASH
    for receipt in receipts:
        if receipt.from_agent != agent_id: return false
        if receipt.previous_hash != expected_previous: return false
        if not verify_signature(receipt): return false
        expected_previous = receipt.message_hash
    return true
```

O(n) with one signature verification per receipt. Ed25519: ~0.1ms/receipt. 10,000 receipts: ~1 second.

---

## 6. Provenance DAG and Grounding

**Source:** NotaryOS Grounding Engine (proprietary)

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
- **Derived layer**: `notary_provenance_edges` table for efficient traversal

**AND logic for diamond dependencies**: If ANY ancestor in ANY path is invalid, the receipt is ungrounded. Weakest-link model.

### 6.3 Cycle Detection: `validate_dag()`

Before storing provenance edges, DFS verifies no cycles exist (lines 128-187):

1. Empty refs fast path: return valid
2. Self-reference check: immediate rejection
3. DFS from each ref through reverse edges, checking if path leads back to new receipt
4. Max depth safety limit (default 100): exceeding returns invalid

### 6.4 Grounding Check: `check_grounding()`

Async BFS upward walk (lines 195-303):

1. DB availability guard (returns UNKNOWN if no pool)
2. Root receipt detection (no edges = always GROUNDED)
3. BFS through ancestors, checking each for INVALID status
4. AND-logic short circuit: first tainted ancestor terminates walk
5. Exception handler: database errors return UNKNOWN

### 6.5 Cascade Propagation: `propagate_ungrounding()`

**The most dangerous operation in NotaryOS.** A single call can mark hundreds of downstream receipts as ungrounded (lines 311-463).

1. Generate deterministic invalidation ID
2. Mark source receipt as INVALID
3. BFS downward through dependents
4. Update each to UNGROUNDED (preserving existing INVALID status)
5. Build `CascadeReport` with affected hashes, agents, depth

Critical WHERE clause: `AND grounding_status != 'invalid'` prevents overwriting root causes.

### 6.6 Grounding Report

`get_grounding_report()` (lines 471-653) returns a full `GroundingReport` with the complete DAG structure, suitable for API responses and visualization.

---

## 7. Counterfactual Receipts

**Source:** NotaryOS Counterfactual Engine (proprietary)

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

Counterfactual canonical format starts with `"counterfactual"` prefix:

```
counterfactual|receipt_id|timestamp|from_agent|to_agent|capability|message_hash|previous_hash|refs_str|action_not_taken|capability_hash|opportunity_hash|decision_hash
```

This prevents type repurposing attacks -- valid action signatures always fail against counterfactual format.

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
# Server-side engine API (illustrative — receipt creation requires API key via SDK)
proof = await seal_counterfactual(
    action_not_taken="financial.execute_trade",
    capability_proof={"permissions": ["trade.execute"], "account": "acme"},
    opportunity_context={"ticker": "ACME", "price": 142.50, "signal": "buy"},
    decision_reason="Risk score 0.87 exceeds threshold 0.75",
    from_agent="financial-agent",
    declination_reason="risk",
    validity_window_minutes=60,
)

assert proof.valid
assert proof.proofs_complete
assert proof.badge.startswith("cf:")

result = await verify_counterfactual(proof)
assert result["valid"] is True
```

---

## 8. SDKs

> **Note on field naming:** The internal `Stamp` dataclass (proprietary engine) uses `from_agent`, `to_agent`, `capability`, and `message_hash`. The public SDK `Receipt` maps these to `agent_id`, `action_type`, and `payload_hash` respectively. The canonical format for signing uses the internal field names.

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

### 8.4 High-Level seal() API (Proprietary)

**Source:** NotaryOS Engine + `sdk/typescript/notary_seal.ts` (open source TypeScript wrapper)

```typescript
import { seal, verify } from './notary_seal';

const stamp = await seal({ message: "hello" }, { from_agent: "my-agent", to_agent: "target" });
console.log(stamp.badge);  // seal:a1b2...c3d4

const result = await verify(stamp);
```

**Offline fallback:** If API is unreachable, produces unsigned local stamp (`signature: "unsigned"`, `key_id: "local-offline"`). Message flow is never blocked.

> The `seal()` API uses the internal Stamp field names (`from_agent`, `to_agent`, `capability`). For SDK-based integration, prefer `NotaryClient.issue()` which uses the public field names (`agent_id`, `action_type`).

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

**Source:** NotaryOS Auto-Receipt Middleware (proprietary)

Automatically generates receipts for every A2A message without adding response latency.

**Operating Modes:**

| Mode | Behavior |
|------|----------|
| `shadow` (default) | Generate receipts, log at DEBUG. No response modification. |
| `opt-in` | Attach headers only when `X-Notary-Enable: true` in request. |
| `active` | Always attach receipt headers to 2xx responses. |

**Design principles:** Non-blocking (seal runs as background task), fail-open (exceptions never block A2A), body caching (receive-replay pattern), lazy engine import.

**Response Headers (active/opt-in mode):**

| Header | Description |
|--------|-------------|
| `X-Notary-Mode` | Current mode |
| `X-Notary-Receipt-Id` | Receipt badge |
| `X-Notary-Seal` | Seal value |
| `X-Notary-Chain` | Agent ID + chain sequence |

### 10.2 Circuit Breaker

Latency-based circuit breaker for the seal pipeline (lines 50-173).

| Parameter | Default | Description |
|-----------|---------|-------------|
| `threshold_ms` | `200.0` | Rolling average that triggers trip |
| `window_size` | `10` | Sliding window samples |
| `cooldown_seconds` | `30.0` | Duration before auto-reset |

State machine: CLOSED (normal) -> OPEN (skip seals) -> auto-reset after cooldown.

### 10.3 Abuse Detection

**Source:** NotaryOS Abuse Detection Engine (proprietary)

Per-agent verification pattern monitoring with in-memory sliding windows + optional Redis backing.

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

**Source:** NotaryOS Notification Service (proprietary)

Sends formatted receipt summaries via A2A protocol to Telegram gateway.

**Modes:** `all`, `human_facing` (default), `errors_only`, `off`

All methods are designed to never raise. HTTP call uses 5-second timeout. Failures are logged and return `False`.

---

## 11. Database Schema

**Source:** `scripts/notary_grounding_migration.sql`

### 11.1 Core Tables

**`notary_action_receipts`** -- Primary receipt storage:

| Column | Type | Description |
|--------|------|-------------|
| `receipt_hash` | `TEXT` PK | SHA-256 hash, unique identifier |
| `agent_id` | `TEXT` NOT NULL | From-agent identifier |
| `action_type` | `TEXT` NOT NULL | Capability name |
| `signature` | `TEXT` NOT NULL | Cryptographic signature |
| `signature_type` | `TEXT` NOT NULL | Algorithm identifier |
| `key_id` | `TEXT` NOT NULL | Signing key identifier |
| `chain_previous` | `TEXT` | Previous receipt hash |
| `chain_sequence` | `INTEGER` | Zero-based chain position |
| `provenance_refs` | `TEXT[]` DEFAULT `'{}'` | Referenced receipt hashes |
| `grounding_status` | `TEXT` DEFAULT `'grounded'` | Grounding state |
| `grounding_checked_at` | `TIMESTAMPTZ` | Last check timestamp |
| `created_at` | `TIMESTAMPTZ` DEFAULT `NOW()` | Creation time |

**`notary_agent_state`** -- Chain head tracking:

| Column | Type | Description |
|--------|------|-------------|
| `agent_id` | `TEXT` PK | Agent identifier |
| `chain_head` | `TEXT` | Most recent receipt hash |
| `chain_length` | `INTEGER` | Total chain receipts |
| `last_updated` | `TIMESTAMPTZ` | Last seal timestamp |

### 11.2 Provenance Table

**`notary_provenance_edges`** -- DAG edges:

| Column | Type | Description |
|--------|------|-------------|
| `id` | `SERIAL` PK | Surrogate key |
| `receipt_hash` | `TEXT` NOT NULL FK | Child receipt |
| `references_hash` | `TEXT` NOT NULL | Parent receipt |
| `edge_type` | `TEXT` DEFAULT `'depends_on'` | `depends_on`, `supersedes`, `amends` |
| `created_at` | `TIMESTAMPTZ` DEFAULT `NOW()` | Edge creation time |

**Indexes:** `idx_provenance_edges_receipt` (child-to-parent), `idx_provenance_edges_ref` (parent-to-child), `idx_receipts_grounding` (by status), `idx_receipts_grounding_agent` (per-agent status).

### 11.3 Counterfactual Table

**`notary_counterfactual_receipts`** -- Proof of non-action:

| Column | Type | Description |
|--------|------|-------------|
| `id` | `SERIAL` PK | Surrogate key |
| `receipt_hash` | `TEXT` UNIQUE NOT NULL | Unique identifier |
| `agent_id` | `TEXT` NOT NULL | Agent that declined |
| `action_type` | `TEXT` NOT NULL | Action not taken |
| `capability_proof` | `JSONB` NOT NULL | Permission evidence |
| `opportunity_context_hash` | `TEXT` NOT NULL | Conditions hash |
| `decision_reason` | `TEXT` | Human-readable explanation |
| `decision_hash` | `TEXT` NOT NULL | Reasoning hash |
| `signature` | `TEXT` NOT NULL | Cryptographic signature |
| `signature_type` | `TEXT` NOT NULL | Algorithm |
| `key_id` | `TEXT` NOT NULL | Key identifier |
| `chain_previous` | `TEXT` | Chain link |
| `chain_sequence` | `INTEGER` | Chain position |
| `grounding_status` | `TEXT` DEFAULT `'grounded'` | Status |
| `created_at` | `TIMESTAMPTZ` DEFAULT `NOW()` | Creation time |

### 11.4 Billing Tables

**`notary_agents`**: `agent_id` (PK), `tier`, `stripe_customer_id`, `api_key_hash`, `created_at`

**`notary_usage`**: `agent_id`, `period_start`, `period_end`, `receipts_issued`, `verifications`, `overage_notified`

---

## 12. Configuration Reference

### 12.1 Environment Variables

#### Signing and Cryptography

| Variable | Default | Description |
|----------|---------|-------------|
| `RECEIPT_SIGNER_TYPE` | `"ed25519"` | Signing algorithm |
| `ED25519_SIGNING_KEY` | (none) | Base64-encoded PEM private key |
| `CAPABILITY_PRIVATE_KEY` | (none) | Fallback Ed25519 key |
| `ED25519_KEY_ID` | `"ed25519-key-v1"` | Key rotation identifier |
| `NOTARY_SECRET_KEY` | (auto in dev) | HMAC-SHA256 secret |
| `NOTARY_KEY_ID` | `"hmac-key-v1"` | HMAC key identifier |
| `NOTARY_ENVIRONMENT` | `"development"` | `"production"` enforces explicit keys |

#### Middleware

| Variable | Default | Description |
|----------|---------|-------------|
| `NOTARY_MIDDLEWARE_MODE` | `"shadow"` | `"shadow"`, `"opt-in"`, `"active"` |
| `NOTARY_MIDDLEWARE_ENABLED` | `"true"` | Master kill switch |
| `NOTARY_CIRCUIT_BREAKER_MS` | `"200"` | Latency threshold for trip |

#### Telegram Notifications

| Variable | Default | Description |
|----------|---------|-------------|
| `NOTARY_NOTIFY_ENABLED` | `"true"` | Kill switch |
| `NOTARY_NOTIFY_MODE` | `"human_facing"` | Filter mode |
| `NOTARY_NOTIFY_TELEGRAM_USER_ID` | -- | Target user ID |
| `NOTARY_GATEWAY_HOST` | `"localhost"` | API server host |
| `NOTARY_GATEWAY_PORT` | `"8000"` | API server port |

### 12.2 Enterprise Thresholds (YAML)

**Source:** `config/enterprise_thresholds.yaml`

**Key Rotation:** `auto_rotate: true`, `rotation_interval_days: 90`, `rotation_warning_days: 14`, `max_key_age_days: 180`, `overlap_hours: 24`

**Abuse Detection:** `failure_rate_suspend: 0.50`, `failure_rate_warning: 0.25`, `failure_window_seconds: 3600`, `min_requests: 10`, `max_consecutive_failures: 20`, `cooldown_minutes: 30`

**Billing:** `grace_period_days: 7`, `overage_soft_limit_pct: 120`, `overage_hard_limit_pct: 200`, `free_tier_monthly_receipts: 100`, `starter: 10000`, `pro: 100000`

**SLOs:** uptime 99.9%, issue P50 <15ms, issue P99 <100ms, verify P50 <5ms, verify P99 <50ms, max chain depth 1,000,000

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

1. **Payload normalization**: `json.dumps(sort_keys=True, separators=(",",":"))` -> deterministic bytes
2. **SHA-256 hash**: 64-char hex digest of payload bytes
3. **Chain lookup**: Previous hash from `_chains[from_agent]` or genesis
4. **Receipt ID**: `seal:{SHA-256(timestamp|from_agent|message_hash|previous_hash)[:8]}`
5. **Canonical string**: Pipe-delimited fields in fixed order
6. **Ed25519 signing**: 64-byte deterministic signature, base64url-encoded
7. **Verification**: Reconstruct canonical, verify signature with public key. Completely offline.

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

| Feature | Free ($0/mo) | Starter ($29/mo) | Pro ($99/mo) |
|---------|:---:|:---:|:---:|
| Receipts/month | 100 | 10,000 | 100,000 |
| Verifications/month | 500 | 50,000 | 500,000 |
| Rate limit | 60 req/min | 300 req/min | 1,000 req/min |
| Ed25519 signatures | Yes | Yes | Yes |
| SDKs (Python/TS/Go) | Yes | Yes | Yes |
| Public key & JWKS | Yes | Yes | Yes |
| Hash chain linking | -- | Yes | Yes |
| Provenance DAG | -- | Yes | Yes |
| Counterfactual receipts | -- | -- | Yes |
| Webhook notifications | -- | Yes | Yes |
| Telegram notifications | -- | Yes | Yes |
| Priority support | -- | -- | Yes |
| Key rotation | Manual | Auto (90d) | Auto (custom) |

**Overage:** Soft limit at 120% (warning), hard limit at 200% (blocked). 7-day grace period for new accounts.

**SLOs:** 99.9% uptime, seal P50 <15ms, verify P50 <5ms.

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

## Appendix B: Open Source vs Proprietary Boundary

### Open Source (This Repository)

| Component | Location |
|-----------|----------|
| React Verification UI | `ui/` |
| TypeScript SDK | `sdk/typescript/` |
| Python SDK | `sdk/python/` |
| Go SDK | `sdk/go/` |
| DB Migrations | `migrations/` |
| Configuration | `config/` |
| Code Examples | `examples/` |

### Proprietary (NotaryOS Backend Engine)

| Component | Description |
|-----------|-------------|
| NotaryEngine | Core receipt creation and sealing logic |
| ReceiptSigner | HMAC-SHA256 and Ed25519 cryptographic signing |
| Grounding DAG | Provenance graph construction and validation |
| Counterfactual Engine | "What-if" receipt generation for non-actions |
| Abuse Detector | Rate pattern analysis and anomaly detection |
| Receipt Notifier | Real-time notification delivery |
| Auto-Receipt Middleware | Transparent receipt generation for A2A messages |
| API Endpoints | REST API for receipt operations and JWKS |
| Billing Integration | Stripe metering and subscription management |

---

## Appendix C: Migration Guide (v1.5.19 to v1.5.20+)

**Breaking changes: None.** All changes are additive with backward-compatible defaults.

### Step 1: Run Migration SQL

```sql
\i migrations/notary_grounding_migration.sql
```

### Step 2: Verify

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'notary_action_receipts'
  AND column_name IN ('provenance_refs', 'grounding_status', 'grounding_checked_at');

SELECT table_name FROM information_schema.tables
WHERE table_name IN ('notary_provenance_edges', 'notary_counterfactual_receipts');
```

### Step 3: Update SDK Clients

Existing code works unchanged. New features available via `provenance_refs` parameter and `seal_counterfactual()`.

### Step 4 (Optional): Enable Auto-Receipt Middleware

Starts in shadow mode. Set `NOTARY_MIDDLEWARE_MODE=active` for full operation.

### Step 5 (Optional): Initialize Abuse Detection

Call `initialize_abuse_detector(redis_client, config)` at startup.

### Rollback

Drop new tables/columns if needed. Pre-existing receipts and signatures remain valid.

---

*NotaryOS Technical Reference Manual v1.5.21*
*Open-source cryptographic verification for AI agents*
