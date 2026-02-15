# NotaryOS Security Architecture

> **Public-facing security principles and design guarantees**
>
> Date: 2026-01-31

---

## Core Principle

**"Agents get the product API, never infrastructure primitives."**

NotaryOS separates the public product surface (SDK + verification API) from the signing infrastructure. Agents can issue and verify receipts; they cannot access signing keys, internal services, or crypto operations directly.

---

## Public API Surface

### Core Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/v1/notary/issue` | POST | API Key | Issue a signed receipt |
| `/v1/notary/verify` | POST | Optional | Verify receipt signature and chain |
| `/v1/notary/public-key` | GET | API Key | Fetch Ed25519 public key for offline verification |
| `/v1/notary/status` | GET | API Key | Service health check |
| `/v1/notary/r/:hash` | GET | None | Public receipt lookup |

### Response Guarantees

All API responses:
- Return `key_id` and `algorithm`, never raw key material
- Return `receipt_hash`, never internal identifiers
- Include human-readable error reasons, never stack traces
- Use generic `correlation_id` for support requests

---

## Cryptographic Security Model

| Threat | Defense | Property |
|--------|---------|----------|
| Forge a receipt | Ed25519 asymmetric signing | Authenticity |
| Tamper with fields | Canonical format signs all fields | Integrity |
| Reorder receipts | Per-agent hash chain linkage | Ordering |
| Deny an action | Non-repudiation via Ed25519 + public key | Non-repudiation |

### Offline Verification

Verification requires only two inputs: the receipt JSON and the public key. No server, no API key, no private key, no trust in the verifier.

---

## Key Management

| State | Can Sign | Can Verify |
|-------|----------|------------|
| Active | Yes | Yes |
| Retiring | No | Yes (24-hour overlap) |
| Revoked | No | No |

Keys rotate automatically. Active keys are published via the `/v1/notary/public-key` endpoint.

---

## SDK Security

- API keys are sent via `X-API-Key` header, never in URL parameters
- SDKs validate API key format before making requests (`notary_live_` or `notary_test_` prefix)
- Auto-receipt wrappers redact sensitive arguments (keys, passwords, tokens) before including in payloads
- All payloads are truncated to 4KB to prevent exfiltration
- Receipt queue failures are caught silently to never break agent execution

---

## Responsible Disclosure

Report security issues to: security@agenttownsquare.com

---

*Security architecture by Agent Town Square*
