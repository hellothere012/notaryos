# NotaryOS

> [!NOTE]
> **🚀 Beta Launch** — NotaryOS is freshly launched and in active development. You may encounter bugs or rough edges. If something's broken, please [open a GitHub issue](https://github.com/hellothere012/notaryos/issues) or contact us directly at [hello@notaryos.org](mailto:hello@notaryos.org). We read every message.

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

## Try It Now (Terminal Only — No Install)

Everything below works with just `curl` and a terminal. No SDK, no dependencies, no account needed for verification.

### 1. Check service status

```bash
curl -s https://api.agenttownsquare.com/v1/notary/status | python3 -m json.tool
```

You'll see `"status": "active"`, the signing algorithm (`ed25519`), and available capabilities.

### 2. Get a signed sample receipt

```bash
curl -s https://api.agenttownsquare.com/v1/notary/sample-receipt | python3 -m json.tool
```

This returns a real Ed25519-signed receipt — no API key needed. Save the output, you'll use it next.

### 3. Verify the receipt

```bash
# Paste the full receipt JSON from step 2 into the "receipt" field:
curl -s -X POST https://api.agenttownsquare.com/v1/notary/verify \
  -H "Content-Type: application/json" \
  -d '{
    "receipt": {
      "receipt_id": "PASTE_RECEIPT_ID",
      "payload_hash": "PASTE_PAYLOAD_HASH",
      "signature": "PASTE_SIGNATURE",
      "signature_type": "ed25519",
      "timestamp": "PASTE_TIMESTAMP"
    }
  }' | python3 -m json.tool
```

You'll see `"valid": true` and `"signature_ok": true`. Now try changing one character in the `payload_hash` and run it again — verification will fail instantly.

### 4. Issue your own receipt (requires free API key)

Sign up at [notaryos.org](https://notaryos.org), create an API key, then:

```bash
curl -s -X POST https://api.agenttownsquare.com/v1/notary/issue \
  -H "Content-Type: application/json" \
  -H "X-API-Key: notary_live_your_key_here" \
  -d '{
    "action_type": "fund_transfer",
    "payload": {
      "from": "agent-47",
      "to": "vendor-12",
      "amount": 500,
      "currency": "USD"
    }
  }' | python3 -m json.tool
```

The response includes `receipt_id`, `signature`, `payload_hash`, `receipt_hash`, and a `verify_url` you can share with anyone.

### 5. Chain receipts together

Pass the `receipt_hash` from the previous receipt to link them:

```bash
curl -s -X POST https://api.agenttownsquare.com/v1/notary/issue \
  -H "Content-Type: application/json" \
  -H "X-API-Key: notary_live_your_key_here" \
  -d '{
    "action_type": "compliance.check",
    "payload": {
      "regulation": "MiCA",
      "passed": true
    },
    "previous_receipt_hash": "PASTE_RECEIPT_HASH_FROM_STEP_4"
  }' | python3 -m json.tool
```

Now these two receipts are cryptographically linked. Tamper with the first one and the chain breaks.

### 6. Issue a counterfactual receipt (proof of non-action)

This is the differentiator. Prove what your agent *chose not to do*:

```bash
curl -s -X POST https://api.agenttownsquare.com/v1/notary/issue \
  -H "Content-Type: application/json" \
  -H "X-API-Key: notary_live_your_key_here" \
  -d '{
    "action_type": "trade.declined",
    "payload": {
      "counterfactual": true,
      "reason": "risk_threshold_exceeded",
      "would_have": {
        "action": "sell",
        "symbol": "BTC",
        "qty": 50,
        "value": 150000
      },
      "agent": "trading-bot-1"
    }
  }' | python3 -m json.tool
```

This receipt is cryptographic proof that your agent *could* have executed a $150k trade but declined. Same Ed25519 signature, same hash chain, same public verifiability.

### 7. Look up any receipt publicly (no API key)

Anyone can verify a receipt by its hash — no account needed:

```bash
curl -s https://api.agenttownsquare.com/v1/notary/r/PASTE_RECEIPT_HASH | python3 -m json.tool
```

### 8. Get the public key for offline verification

```bash
curl -s https://api.agenttownsquare.com/v1/notary/public-key | python3 -m json.tool
```

Returns the Ed25519 public key in PEM format. You can verify any receipt signature offline using any Ed25519 library — no API calls, no trust assumptions.

Or use the [live verification UI](https://notaryos.org/verify) to paste and verify any receipt visually.

---

## Run the 25-Receipt Demo

See everything NotaryOS can do — hash chaining, counterfactual receipts, tamper detection, and real performance numbers — in under 60 seconds. Uses only 25 of your 100 free monthly receipts.

### What the demo does

| Phase | Receipts | What it proves |
|-------|----------|----------------|
| **Chained actions** | 10 | A simulated trading bot issues 10 receipts linked by SHA-256 hash chain. Modify any receipt and the entire chain breaks. |
| **Counterfactual receipts** | 15 | Proof of actions the agent *chose not to take* — trades declined, transfers blocked, deployments halted. Cryptographic evidence of restraint. |
| **Tamper detection** | 0 | Corrupts a receipt and shows verification failing instantly. |
| **Public lookup** | 0 | Looks up a counterfactual receipt by hash — no API key needed. Anyone can verify. |

**Total: 25 receipts** (75 remaining on free tier)

### Step-by-step setup

**1. Get a free API key**

Sign up at [notaryos.org](https://notaryos.org), go to **API Keys**, and create a key. It starts with `notary_live_`.

**2. Install the SDK**

```bash
pip install notaryos
```

**3. Clone this repo**

```bash
git clone https://github.com/hellothere012/notaryos.git
cd notaryos
```

**4. Set your API key and run**

```bash
export NOTARY_API_KEY="notary_live_your_key_here"
python examples/demo_25_receipts.py
```

### What you'll see

```
======================================================================
  NotaryOS — 25-Receipt Demo
  Cryptographic receipts for AI agent accountability
======================================================================

[1/7] Checking service health...
  Status:     active
  Signing:    ed25519
  Public key: available

[2/7] Issuing 10 chained receipts (standard actions)...
  [ 1/10]  agent.startup              4.2ms  hash: a3f8c91d2b4e7f01...
  [ 2/10]  market.data_fetch          3.8ms  hash: 7d2e0f5a1c8b3d96...
  ...

[3/7] Issuing 15 counterfactual receipts (actions NOT taken)...
  [ 1/15]  trade.declined               5.1ms  reason: risk_threshold_exceeded
  [ 2/15]  transfer.blocked             3.9ms  reason: insufficient_funds
  ...

[4/7] Verifying all 25 receipts...
  25/25 receipts verified successfully
  All signatures: Ed25519 (RFC 8032)

[5/7] Tamper detection — modifying a receipt...
  Original hash:  7a3f9c1d2b4e8f015a6d3c7b...
  Tampered hash:  00003f9c1d2b4e8f015a6d3c7b...
  Result:         TAMPER DETECTED — verification failed

[6/7] Public receipt lookup (no API key required)...
  Found receipt:  d4e7f2a1b8c3059e6d1a4f7b...
  Lookup time:    12.3ms
  Anyone can verify this receipt at notaryos.org — no account needed.

[7/7] Performance summary
--------------------------------------------------
  Issue (standard)      avg:   4.5ms  p50:   4.2ms  min:   3.1ms  max:   7.8ms
  Issue (counter.)      avg:   4.3ms  p50:   4.0ms  min:   3.0ms  max:   6.9ms
  Verify                avg:   3.2ms  p50:   3.0ms  min:   2.4ms  max:   5.1ms

  Total receipts:   25 (10 standard + 15 counterfactual)
  Throughput:       178 receipts/sec
  Chain length:     25 linked receipts
  Tamper detection: working
  Public lookup:    working
======================================================================
```

### Why counterfactual receipts matter

Traditional audit logs only record what happened. Counterfactual receipts prove what *didn't* happen — and why:

- An agent **declined a $150,000 trade** because risk thresholds were exceeded
- A deployment was **halted** because health checks failed
- A bulk email was **not sent** because rate limits were hit

Each of these non-actions gets the same cryptographic guarantees as a real action: Ed25519 signature, SHA-256 hash, chain linking, and public verifiability. When a regulator asks "why didn't your agent act?", you have tamper-proof evidence.

### After running the demo

- **View your receipts** — sign in at [notaryos.org](https://notaryos.org) and go to History
- **Verify any receipt** — paste a receipt hash into the [verification page](https://notaryos.org/verify) (no account needed)
- **Inspect the chain** — each receipt's `previous_receipt_hash` links to the one before it
- **Run the full test suite** — `python sdk/python/examples/test_e2e_full.py` (uses more receipts)

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
