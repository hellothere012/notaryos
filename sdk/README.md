# NotaryOS SDK v2.2.0

Cryptographic receipts for AI agent actions. Every decision sealed, verified, and auditable.

[notaryos.org](https://notaryos.org)

## Available SDKs

| Language | Package | Install | Deps |
|----------|---------|---------|------|
| **Python** | [`notaryos`](python/) | `pip install notaryos` | Zero (stdlib urllib + hashlib) |
| **TypeScript** | [`notaryos`](typescript/) | `npm install notaryos` | Zero (native fetch + Web Crypto) |

## 3-Line Quick Start

### Python

```python
from notaryos import NotaryClient
notary = NotaryClient()
receipt = notary.seal("agent.decision", {"model": "gpt-4", "action": "approve"})
```

### TypeScript

```typescript
import { NotaryClient } from 'notaryos';
const notary = new NotaryClient();
const receipt = await notary.seal('agent.decision', { model: 'gpt-4', action: 'approve' });
```

The zero-argument constructor uses a built-in demo key (10 requests/minute). Pass your own key for production usage:

```python
notary = NotaryClient(api_key="notary_live_xxx")
```

```typescript
const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });
```

## Core API

| Method | Python | TypeScript | Description |
|--------|--------|------------|-------------|
| **seal** | `notary.seal(action_type, payload)` | `notary.seal(actionType, payload)` | Create a signed receipt (alias for issue) |
| **issue** | `notary.issue(action_type, payload, previous_receipt_hash=None, metadata=None)` | `notary.issue(actionType, payload, options?)` | Create a signed receipt with full options |
| **verify** | `notary.verify(receipt_dict)` | `notary.verify(receipt)` | Verify receipt signature and integrity |
| **lookup** | `notary.lookup(receipt_hash)` | `notary.lookup(receiptHash)` | Retrieve a receipt by its hash |
| **status** | `notary.status()` | `notary.status()` | Service health check |
| **public_key** | `notary.public_key()` | N/A | Get the Ed25519 signing public key |
| **me** | `notary.me()` | `notary.me()` | Get current API key info and usage |

### Standalone Functions

| Function | Python | TypeScript | Description |
|----------|--------|------------|-------------|
| **verify_receipt** | `verify_receipt(receipt_dict)` | `verifyReceipt(receipt)` | Verify a receipt without a client instance |
| **computeHash** | N/A | `computeHash(payload)` | Client-side SHA-256 matching server hashing |

## Counterfactual Receipts

Counterfactual receipts prove what an agent considered but did not do -- decisions not taken, alternatives rejected, paths not chosen.

### Simple Counterfactual (via seal)

```python
notary = NotaryClient(api_key="notary_live_xxx")

receipt = notary.seal("counterfactual.decision", {
    "agent_id": "risk-analyzer",
    "considered_action": "approve_trade",
    "decision": "rejected",
    "reason": "Volatility exceeded threshold"
})
```

### Commit-Reveal Pattern

Temporal binding: commit a decision hash now, reveal the content later.

```python
# Phase 1: Commit (locks the hash)
commit = notary.commit_counterfactual(
    action_type="prediction.market_close",
    payload={"prediction": "AAPL closes above 250"},
    agent_id="forecast-agent"
)

# Phase 2: Reveal (proves the content matches)
reveal = notary.reveal_counterfactual(
    receipt_hash=commit["receipt_hash"],
    reason="Market closed, revealing prediction"
)
```

## API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /v1/notary/seal` | API Key | Create a signed receipt |
| `POST /v1/notary/issue` | API Key | Create a signed receipt (full options) |
| `POST /v1/notary/verify` | Public | Verify receipt signature and integrity |
| `GET /v1/notary/r/{hash}` | Public | Look up receipt by hash |
| `GET /v1/notary/status` | Public | Service health |
| `GET /v1/notary/public-key` | Public | Ed25519 signing public key |
| `GET /.well-known/jwks.json` | Public | JWKS key set |
| `POST /v1/notary/counterfactual/commit` | API Key | Commit-reveal phase 1 |
| `POST /v1/notary/counterfactual/reveal` | API Key | Commit-reveal phase 2 |

## Get an API Key

1. Sign up at [notaryos.org](https://notaryos.org)
2. Go to your dashboard and generate an API key
3. Production keys use the `notary_live_` prefix

## License

BUSL-1.1 -- See [LICENSE](LICENSE)
