# Notary Security Architecture

> **Separation of Product Surface (Notary) from Infrastructure (Protocol)**
>
> Document status: TELE-reviewed architecture spec
> Date: 2026-01-31

---

## Core Principle

**"Notary is a product surface; Protocol is infrastructure. Agents get the product API, never infrastructure primitives."**

---

## Network Zones

### Zone 1: Public Zone (Internet-facing)
- Notary UI (static assets)
- Notary Public API (only intentionally exposed endpoints)

### Zone 2: Service Zone (private network)
- Notary Backend (BFF - Backend-for-Frontend)
- Protocol Backend (crypto operations)
- Policy Gate / internal authz service

### Zone 3: Crypto Zone (most restricted)
- KMS/HSM / signing service
- CA infrastructure
- Key rotation job runners

---

## Connectivity Rules (Non-negotiable)

| Source | Can Reach | Cannot Reach |
|--------|-----------|--------------|
| Agents (Moltbook, Internet) | Notary Public API only | Protocol Backend, Crypto Zone |
| Notary Backend | Protocol Backend (private IP) | Crypto Zone directly |
| Protocol Backend | Crypto Zone only | Public Internet |
| Protocol Backend | — | MUST NOT be reachable from public internet, Moltbook, agent networks, or browser |

---

## Service-to-Service Authentication

### Between Notary Backend ↔ Protocol Backend

**Two-factor authentication required:**

1. **mTLS** (mutual TLS with pinned certs)
   - SPIFFE/SPIRE preferred for service identity
   - Or mutual TLS with certificate pinning

2. **Internal Service JWT**
   - `aud = "protocol-internal"`
   - `exp ≤ 60 seconds`
   - Signed by internal service secret

Protocol rejects ANY request missing BOTH mTLS identity AND internal JWT claims.

---

## Notary as Schema Translator (NOT Pass-through Proxy)

### Anti-pattern (DANGEROUS)
```
Agent → Notary → `/proxy/*` → Protocol (arbitrary JSON forwarded)
```

### Correct pattern (SECURE)
```
Agent → Notary (strict public schema) → Internal RPC (different schema) → Protocol
```

**Key principles:**
- Notary exposes a **small, stable public API** with strict schemas
- Notary calls Protocol via **internal RPC** with different schema + internal fields
- Protocol has **separate internal routes** not mapped 1:1 to public endpoints
- NO generic `/proxy/*`, NO "relay any method", NO shared OpenAPI

---

## Public API Surface (Safe for Agents)

### Core Endpoints (Verification Only)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/verify` | POST | Optional | Verify receipt signature/chain/timestamp |
| `/api/v1/public-keys` | GET | None | Fetch active verification public keys |
| `/api/v1/receipts/sample` | GET | None | Sample receipt for demos |

### Protected Endpoints (Require Auth + Quotas)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/agents/register` | POST | Rate-limited | Agent self-registration (verify-only scope) |
| `/api/v1/agents/me` | GET | API Key | Agent profile |
| `/api/v1/history` | GET | API Key | Verification history (retention rules apply) |
| `/api/v1/webhooks` | POST | API Key | Webhook configuration (strict allowlist) |

### Response Shaping (Prevent Leakage)

**NEVER return:**
- Canonical bytes in full (hash only)
- Internal key names, KMS key ARNs
- CA chain details, rotation schedules
- Stack traces, internal error codes
- Upstream Protocol URLs

**DO return:**
- `key_id` or `key_fingerprint`
- `algorithm`
- `receipt_hash`
- `checks[]` with human-readable error reasons
- Generic `correlation_id`

---

## Internal-Only Endpoints (Protocol/Infrastructure)

These exist ONLY behind the internal boundary, callable ONLY by trusted services/admin:

### Signing Primitives (NEVER PUBLIC)
- `POST /internal/sign`
- `POST /internal/issue-certificate`
- `POST /internal/attest`

### Key Lifecycle (NEVER PUBLIC)
- `POST /internal/rotate-keys`
- `POST /internal/revoke-key`
- `GET /internal/private-keys` (should not exist at all)

### CA Operations (NEVER PUBLIC)
- `POST /internal/ca/*`
- `GET /internal/ca/*`

### Zero-Trust Controls (NEVER PUBLIC)
- Policy definitions
- Allowlists
- Internal routing
- Identity introspection

**CRITICAL:** Even if auth-protected, do NOT expose these publicly. Assume auth bugs happen; rely on network segmentation as the backstop.

---

## Prevent "Signing as a Service" Abuse

### Biggest Risk
If agents can induce Protocol to sign *anything*, you've effectively exposed signing infrastructure.

### Hard Constraints
- **Agents may request verification ONLY**
- **Only trusted internal services may request signing**
- Signing only allowed for **fixed schemas**

### For Dogfooding (NotaryAgent Receipts)
If Notary needs to issue receipts for its own actions:

1. Agent submits action claim (optional)
2. Notary issues **attestation**: "Notary observed request X at time T"
3. Signing call gated behind:
   - Strict schema validation
   - Policy checks (rate, community allowlist, max payload size)
   - Account standing / payment / manual approval

---

## Notary Backend Security Controls

### Request Handling
- Strict request validation + canonicalization before calling Protocol
- Allowlist-only internal methods (no dynamic routing)
- Rate limiting + quotas per API key / IP

### Abuse Prevention
- Payload size limits
- JSON depth limits
- Timeout budgets

### Audit Logging (Structured)
```json
{
  "actor": "api_key_id / agent_id",
  "action": "verify",
  "receipt_hash": "sha256:...",
  "correlation_id": "uuid",
  "timestamp": "ISO8601"
}
```
Note: Log hash, NOT raw receipt by default.

### Response Mapping
- Map Protocol errors → safe public errors
- Never expose internal error codes

### Web Security
- CORS locked down (UI origin only)
- CSRF protection where applicable
- No secrets in browser
- Protocol never reachable from client
- Notary API keys never embedded in frontend

---

## Internal API Contract (Notary ↔ Protocol)

### Example: Verify Receipt

**Internal endpoint:** `POST /internal/verify-receipt`

**Requirements:**
- mTLS + service JWT (both required)

**Request:**
```json
{
  "normalized_receipt": { ... },
  "policy_context": {
    "strict_mode": true,
    "allowed_signer_set_id": "production"
  },
  "request_metadata": {
    "source_api_key_id": "ak_...",
    "correlation_id": "uuid"
  }
}
```

**Response:**
```json
{
  "verdict": "valid",
  "checks": { ... },
  "internal_diagnostics": { ... }  // Filtered by Notary before returning
}
```

Notary filters `internal_diagnostics` into safe public output.

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     INTERNET (AGENTS)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NOTARY PUBLIC API                              │
│           (Rate limiting, Auth, Request validation)              │
│               Endpoints: /verify, /public-keys                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ mTLS + JWT
                           │ Private network only
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PROTOCOL BACKEND                               │
│              (Internal RPC, Crypto operations)                   │
│    Endpoints: /internal/verify-receipt, /internal/sign           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Private network only
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CRYPTO ZONE (KMS/HSM)                          │
│         (Signing keys, CA infrastructure, Key rotation)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Network Isolation
- [ ] Deploy Protocol Backend on private subnet (no public IP)
- [ ] Configure security groups: Protocol accepts only Notary Backend IP
- [ ] Implement mTLS between Notary ↔ Protocol
- [ ] Generate internal service JWT signing key

### Phase 2: API Separation
- [ ] Define strict public OpenAPI spec (verify/public-keys/sample only)
- [ ] Define separate internal OpenAPI spec for Protocol
- [ ] Implement schema translation in Notary Backend
- [ ] Remove any direct agent-accessible routes to Protocol

### Phase 3: Security Controls
- [ ] Implement rate limiting per API key
- [ ] Add structured audit logging
- [ ] Configure response filtering (remove internal fields)
- [ ] Lock down CORS to UI origin

### Phase 4: Monitoring
- [ ] Alert on any Protocol access from non-Notary sources
- [ ] Log all signing operations with full context
- [ ] Monitor for anomalous verification patterns

---

*Security architecture designed by OPUS + TELE via A2A collaboration*
*Date: 2026-01-31*
*For The Triad: Harris, OPUS, TELE*
