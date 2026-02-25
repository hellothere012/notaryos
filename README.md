# NotaryOS

**Cryptographic receipts for AI agent accountability.**

Every action your AI agent takes — API calls, data processing, fund transfers — gets a tamper-evident, Ed25519-signed receipt. If anyone modifies a receipt, verification fails instantly. No logs to edit. No timestamps to backdate.

[![License: BUSL-1.1](https://img.shields.io/badge/License-BUSL--1.1-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/notaryos)](https://www.npmjs.com/package/notaryos)
[![PyPI](https://img.shields.io/pypi/v/notaryos)](https://pypi.org/project/notaryos/)

**[Live Demo](https://notaryos.org)** &nbsp;|&nbsp; **[Docs](https://notaryos.org/docs)** &nbsp;|&nbsp; **[API](https://api.agenttownsquare.com/v1/notary/status)**

---

## Why?

AI agents execute thousands of autonomous decisions daily. They transfer funds, route messages, and analyze data — all through agent-to-agent protocols with **no audit trail**.

Log files are mutable. Databases can be edited. Timestamps can be backdated.

NotaryOS gives you three properties that logs cannot:

| Property | What it means |
|----------|---------------|
| **Integrity** | Proof that content has not been modified since creation |
| **Authenticity** | Proof that content was created by a specific entity |
| **Non-repudiation** | The creator cannot later deny having created it |

---

## Quick Start

### 1. Install

```bash
pip install notaryos
```

### 2. Seal an action

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")
receipt = notary.seal("fund_transfer", "agent-47", {"amount": 500, "to": "vendor-12"})
```

### 3. Verify

```python
result = notary.verify(receipt)
print(result.valid)        # True
print(result.signature_ok) # True
```

That's it. Every `seal()` call returns a cryptographically signed receipt with a SHA-256 hash chain linking it to previous receipts.

---

## Try It Now (No Install)

```bash
# Get a signed sample receipt
curl https://api.agenttownsquare.com/v1/notary/sample-receipt | python3 -m json.tool

# Verify it
curl -X POST https://api.agenttownsquare.com/v1/notary/verify \
  -H "Content-Type: application/json" \
  -d '{"receipt": <paste receipt JSON here>}'
```

Or paste any receipt into the [live verification UI](https://notaryos.org).

---

## How It Works

```
Agent Action (e.g., "transfer $500")
         │
         ▼
┌─────────────────────────────────┐
│        NotaryOS Engine          │
│                                 │
│  1. Hash the payload (SHA-256)  │
│  2. Chain to previous receipt   │
│  3. Sign with Ed25519           │
│  4. Return signed receipt       │
└─────────────────────────────────┘
         │
         ▼
Tamper-evident receipt returned to agent
```

Each receipt contains:
- **SHA-256 hash** of the original payload (privacy-preserving — payloads are never stored)
- **Previous receipt hash** linking to a chain (like a mini-blockchain per agent pair)
- **Ed25519 signature** (verifiable with the public key)
- **Timestamp**, agent IDs, action type, and metadata

If any receipt in the chain is modified, verification fails — pinpointing the exact tampered receipt.

---

## SDKs

Zero-dependency SDKs for Python and TypeScript. Verification works fully offline.

### Python

```bash
pip install notaryos
```

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")

# Seal an agent action
receipt = notary.seal("data_export", "analytics-agent", {"rows": 15000})

# Verify any receipt
result = notary.verify(receipt)

# Get the public key for offline verification
key = notary.public_key()
```

### TypeScript

```bash
npm install notaryos
```

```typescript
import { NotaryClient } from 'notaryos';

const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });

// Issue a receipt
const receipt = await notary.issue({ actionType: 'api_call', payload: { endpoint: '/users' } });

// Verify
const result = await notary.verify(receipt);
console.log(result.valid); // true
```

### Go

```bash
go get github.com/hellothere012/notaryos-go
```

> Go SDK is in development. See [notaryos-go](https://github.com/hellothere012/notaryos-go) for progress.

---

## Framework Integrations

NotaryOS plugs into popular agent frameworks with optional extras:

```bash
pip install notaryos[langchain]     # LangChain
pip install notaryos[crewai]        # CrewAI
pip install notaryos[openai-agents] # OpenAI Agents SDK
pip install notaryos[pydantic-ai]   # Pydantic AI
pip install notaryos[autogen]       # AutoGen
pip install notaryos[all-frameworks] # All of the above
```

---

## API Reference

**Base URL:** `https://api.agenttownsquare.com`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/v1/notary/status` | GET | None | Service health and uptime |
| `/v1/notary/sample-receipt` | GET | None | Generate a signed demo receipt |
| `/v1/notary/verify` | POST | None | Verify any receipt |
| `/v1/notary/issue` | POST | API Key | Create a signed receipt |
| `/v1/notary/public-key` | GET | None | Ed25519 public key for offline verification |

Verification is always free and requires no authentication.

---

## Security Properties

| Property | Implementation |
|----------|----------------|
| **Signing** | Ed25519 (RFC 8032) |
| **Hashing** | SHA-256 hash chain |
| **Non-repudiation** | Server-held signing keys with audit trail |
| **Privacy** | Only payload hashes stored, never raw payloads |
| **Tamper detection** | Chain verification pinpoints modified receipts |
| **Key management** | JWKS-based key rotation and lookup |

---

## Architecture

NotaryOS follows a **razor-and-blade** model:

- **Open source** (this repo): SDKs, verification UI, documentation, examples
- **Proprietary**: The signing engine, key management, and API backend

Verification is free and works offline. Receipt creation requires an API key.

---

## Pricing

| Tier | Receipts/month | Rate Limit | Price |
|------|---------------|------------|-------|
| **Starter** | 100 | 60/min | Free |
| **Explorer** | 10,000 | 300/min | $59/mo |
| **Pro** | 100,000 | 1,000/min | $159/mo |
| **Enterprise** | Unlimited | Custom | Contact us |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Quick Start](docs/QUICKSTART.md) | Get running in 5 minutes |
| [User Manual](docs/USER_MANUAL.md) | Complete usage guide |
| [Technical Manual](docs/TECHNICAL_MANUAL.md) | Architecture and specification |
| [SDK Examples](docs/SDK_EXAMPLES.md) | Code examples for all SDKs |
| [Independent Verification](docs/INDEPENDENT_VERIFICATION.md) | Offline chain verification |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

Business Source License 1.1 (BUSL-1.1). Free to use for any purpose except offering a competing commercial receipt service. Converts to Apache 2.0 on 2029-02-25. See [LICENSE](LICENSE).

---

Built by [Agent Town Square](https://agenttownsquare.com) &nbsp;|&nbsp; [notaryos.org](https://notaryos.org) &nbsp;|&nbsp; [Docs](https://notaryos.org/docs) &nbsp;|&nbsp; [API Status](https://api.agenttownsquare.com/v1/notary/status)
