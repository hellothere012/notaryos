# NotaryOS

> [!NOTE]
> **🚀 Beta Launch** — NotaryOS is freshly launched and in active development. You may encounter bugs or rough edges. If something's broken, please [open a GitHub issue](https://github.com/hellothere012/notaryos/issues) or contact us directly at [hello@notaryos.org](mailto:hello@notaryos.org). We read every message.

**Cryptographic receipts for AI agent accountability — including proof of what your agent chose *not* to do.**

Every action your AI agent takes — API calls, data processing, fund transfers — gets a tamper-evident, Ed25519-signed receipt. If anyone modifies a receipt, verification fails instantly. No logs to edit. No timestamps to backdate.

And when your agent *declines* an action — blocks a trade, skips a transfer, refuses a command — that non-action gets the same cryptographic proof. This is the **counterfactual receipt**.

[![License: BUSL-1.1](https://img.shields.io/badge/License-BUSL--1.1-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/notaryos)](https://www.npmjs.com/package/notaryos)
[![PyPI](https://img.shields.io/pypi/v/notaryos)](https://pypi.org/project/notaryos/)

**[Live Demo](https://notaryos.org)** &nbsp;|&nbsp; **[Docs](https://notaryos.org/docs)** &nbsp;|&nbsp; **[API](https://api.agenttownsquare.com/v1/notary/status)**

---

## Why?

AI agents execute thousands of autonomous decisions daily. They transfer funds, route messages, and analyze data — all through agent-to-agent protocols with **no audit trail**.

Log files are mutable. Databases can be edited. Timestamps can be backdated.

NotaryOS gives you four properties that logs cannot:

| Property | What it means |
|----------|---------------|
| **Integrity** | Proof that a receipt has not been modified since it was issued |
| **Authenticity** | Proof that a receipt was created by a specific agent |
| **Non-repudiation** | The creator cannot later deny having created it |
| **Counterfactual proof** | Cryptographic evidence of what your agent *chose not to do* — and why |

The fourth property is new. No other system provides it.

---

## Counterfactual Receipts — A New Category

Traditional audit logs record what happened. **Counterfactual receipts prove what didn't happen** — with the same cryptographic guarantees as any other receipt.

When your agent declines to act — blocks a trade, refuses a command, withholds a transfer — it issues a counterfactual receipt documenting:

- What action it *could* have taken (and had the capability to execute)
- Why it chose not to (the decision reason)
- The full cryptographic chain linking this decision to prior actions

**Without counterfactual receipts:**

> "Our agent didn't execute the trade." ← Unverifiable claim. The log could be edited.

**With counterfactual receipts:**

> `receipt_id: cf_a3f8c91d` · `signature: 7QZCXN_...` · `valid: true` · `reason: risk_threshold_exceeded`

That's tamper-proof evidence — signed with Ed25519, verifiable by anyone, forever.

### Use cases

| Scenario | What the receipt proves |
|----------|------------------------|
| Trading bot declines a $2M sell order | Agent had authority. Chose not to act. Risk threshold exceeded. |
| Compliance agent blocks a cross-border transfer | Agent evaluated the transaction. OFAC screening triggered. |
| Medical AI refuses to prescribe a drug | Agent saw the request. Contraindication detected. Decision recorded. |
| Autonomous vehicle overrides a route | Agent assessed the path. Safety constraint triggered. Route logged. |
| LLM refuses a user instruction | Agent received the prompt. Policy violated. Refusal recorded. |

Every one of these non-actions is now as auditable as an action.

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

# Standard action receipt
receipt = notary.seal("fund_transfer", "agent-47", {"amount": 500, "to": "vendor-12"})

# Counterfactual receipt — proof your agent chose NOT to act
cf_receipt = notary.seal("trade.declined", "trading-bot-alpha", {
    "counterfactual": True,
    "capability_confirmed": True,
    "reason": "risk_threshold_exceeded",
    "would_have": {"action": "sell", "symbol": "BTC", "value_usd": 150000},
})
```

### 3. Verify (no API key needed)

```python
# Anyone can verify — no API key required
result = notary.verify(cf_receipt)
print(result.valid)        # True
print(result.signature_ok) # True

# Or use the standalone function — no client needed at all
from notaryos import verify_receipt
is_valid = verify_receipt(cf_receipt.to_dict())  # True
```

That's it. Both standard and counterfactual receipts get the same Ed25519 signature and SHA-256 hash chain. Verification is always free and works offline.

---

## Try It Now — No Signup Required

**Verification is always free.** Anyone can verify any receipt with no account, no API key, no install.

### 1. Check service status

```bash
curl -s https://api.agenttownsquare.com/v1/notary/status | python3 -m json.tool
```

You'll see `"status": "active"`, `"signature_type": "ed25519"`, and available capabilities.

### 2. Fetch and verify a signed receipt (2 commands)

```bash
# Fetch a real signed receipt
RECEIPT=$(curl -s https://api.agenttownsquare.com/v1/notary/sample-receipt \
  | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin)['receipt']))")

# Verify it — no account needed
curl -s -X POST https://api.agenttownsquare.com/v1/notary/verify \
  -H "Content-Type: application/json" \
  -d "{\"receipt\": $RECEIPT}" | python3 -m json.tool
```

You'll see:

```json
{
  "valid": true,
  "signature_ok": true,
  "structure_ok": true,
  "chain_ok": true,
  "reason": "Receipt verified successfully"
}
```

Now change any character in `$RECEIPT` and run verify again. You'll see `"valid": false` — tamper detected instantly.

**Counterfactual receipts have this exact same structure.** The `payload` field contains `"counterfactual": true` and documents the decision. The signature, chain, and verification are identical to any other receipt.

### 3. Inspect what's inside a receipt

```bash
echo $RECEIPT | python3 -m json.tool
```

Fields of note:
- **`signature`** — Base64url Ed25519 signature over the payload hash (never the raw payload)
- **`payload_hash`** — SHA-256 of the original payload. The payload itself is never stored.
- **`previous_receipt_hash`** — links this receipt to the prior one (hash chain)
- **`verify_url`** — public URL anyone can open to verify this receipt, forever

### 4. Get the public key (offline verification)

```bash
curl -s https://api.agenttownsquare.com/v1/notary/public-key | python3 -m json.tool
```

Returns the Ed25519 public key in PEM + JWK. Verify any receipt signature locally — no API calls, no trust assumptions, no dependency on NotaryOS being online.

---

## Issuing Counterfactual Receipts (Free API Key)

Sign up at [notaryos.org](https://notaryos.org) → API Keys. Free tier includes 100 receipts/month.

```bash
export NOTARY_KEY="notary_live_your_key_here"
```

### Healthcare — AI refuses a prescription

A medical AI agent evaluates a prescription request and refuses it due to a contraindication. That refusal needs to be as auditable as a filled prescription.

```bash
CF_HEALTH=$(curl -s -X POST https://api.agenttownsquare.com/v1/notary/seal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NOTARY_KEY" \
  -d '{
    "action_type": "prescription.refused",
    "agent_id": "medical-ai-v2",
    "payload": {
      "counterfactual": true,
      "capability_confirmed": true,
      "reason": "contraindication_detected",
      "drug_requested": "warfarin",
      "conflict_with": "aspirin",
      "patient_ref": "anon-8821",
      "would_have": "issued prescription #RX-4492"
    }
  }')

# Verify it — no API key needed, share with anyone
curl -s -X POST https://api.agenttownsquare.com/v1/notary/verify \
  -H "Content-Type: application/json" \
  -d "{\"receipt\": $CF_HEALTH}" | python3 -m json.tool
```

`capability_confirmed: true` is critical — it documents the agent *had authority* to act, not merely that it lacked permission. That distinction matters in audits and litigation.

### Finance — Trading bot declines a high-risk trade

A trading agent has authority to execute a $150k BTC sell. Risk thresholds are exceeded. The agent declines. Without a counterfactual receipt, there is no tamper-proof evidence it ever evaluated the trade.

```bash
CF_TRADE=$(curl -s -X POST https://api.agenttownsquare.com/v1/notary/seal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NOTARY_KEY" \
  -d '{
    "action_type": "trade.declined",
    "agent_id": "trading-bot-alpha",
    "payload": {
      "counterfactual": true,
      "capability_confirmed": true,
      "reason": "risk_threshold_exceeded",
      "market": "BTC-USD",
      "would_have": { "action": "sell", "qty": 50, "value_usd": 150000 },
      "risk_score": 0.94,
      "threshold": 0.80
    }
  }')

curl -s -X POST https://api.agenttownsquare.com/v1/notary/verify \
  -H "Content-Type: application/json" \
  -d "{\"receipt\": $CF_TRADE}" | python3 -m json.tool
```

### Chaining decisions

Real workflows are chains. Link receipts so tampering with any step breaks the whole chain:

```bash
PREV_HASH=$(echo $CF_TRADE | python3 -c "import json,sys; print(json.load(sys.stdin).get('receipt_hash',''))")

curl -s -X POST https://api.agenttownsquare.com/v1/notary/seal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NOTARY_KEY" \
  -d "{
    \"action_type\": \"risk.alert_sent\",
    \"agent_id\": \"trading-bot-alpha\",
    \"payload\": {
      \"alert_type\": \"risk_threshold_breach\",
      \"notified\": \"compliance-team\"
    },
    \"previous_receipt_hash\": \"$PREV_HASH\"
  }" | python3 -m json.tool
```

Modify the trade receipt and this alert receipt's chain verification fails — proving the alert was generated in response to that exact decision.

### Standard action receipt (non-counterfactual)

```bash
curl -s -X POST https://api.agenttownsquare.com/v1/notary/seal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NOTARY_KEY" \
  -d '{
    "action_type": "fund_transfer",
    "agent_id": "payment-agent-1",
    "payload": {
      "to": "vendor-12",
      "amount": 500,
      "currency": "USD"
    }
  }' | python3 -m json.tool
```

### Look up any receipt by hash (no API key)

```bash
# Anyone can verify a receipt forever using just its hash
curl -s https://api.agenttownsquare.com/v1/notary/r/PASTE_RECEIPT_HASH | python3 -m json.tool
```

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
| `/v1/notary/status` | GET | None | Service health and signing key info |
| `/v1/notary/public-key` | GET | None | Ed25519 public key (PEM + JWK) for offline verification |
| `/v1/notary/sample-receipt` | GET | None | Synthetic signed demo receipt |
| `/v1/notary/verify` | POST | None | Verify any receipt — signature, structure, chain |
| `/v1/notary/r/{hash}` | GET | None | Look up a receipt by SHA-256 hash |
| `/v1/notary/seal` | POST | API Key | Issue a signed receipt |
| `/v1/notary/history` | GET | Clerk JWT | Paginated receipt history |
| `/v1/api-keys` | GET/POST | Clerk JWT | List and create API keys |

Verification is always free and requires no authentication. Full spec: **[docs/openapi.yaml](docs/openapi.yaml)**

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
| [OpenAPI Spec](docs/openapi.yaml) | OpenAPI 3.0.3 — import into Postman, Insomnia, etc. |
| [Independent Verification](docs/INDEPENDENT_VERIFICATION.md) | Offline chain verification |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

Business Source License 1.1 (BUSL-1.1). Free to use for any purpose except offering a competing commercial receipt service. Converts to Apache 2.0 on 2029-02-25. See [LICENSE](LICENSE).

---

Built by [Agent Town Square](https://agenttownsquare.com) &nbsp;|&nbsp; [notaryos.org](https://notaryos.org) &nbsp;|&nbsp; [Docs](https://notaryos.org/docs) &nbsp;|&nbsp; [API Status](https://api.agenttownsquare.com/v1/notary/status)
