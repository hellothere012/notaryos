# NotaryOS

**Cryptographic receipt system for AI agent accountability.**

NotaryOS creates tamper-evident, cryptographically signed receipts for agent-to-agent communications. Every message between AI agents gets a receipt that proves what was sent, by whom, and when — with a hash chain that detects any tampering.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/notaryos)](https://www.npmjs.com/package/notaryos)
[![PyPI](https://img.shields.io/pypi/v/notaryos)](https://pypi.org/project/notaryos/)

## Why NotaryOS?

AI agents execute thousands of autonomous decisions daily — transferring funds, routing messages, analyzing reports. They communicate through agent-to-agent protocols with **no audit trail**. Log files are mutable. Databases can be edited. Timestamps can be backdated.

NotaryOS provides three properties that logs cannot:

1. **Integrity** — proof that content has not been modified since creation
2. **Authenticity** — proof that content was created by a specific entity
3. **Non-repudiation** — the creator cannot later deny having created it

## Quick Start

```bash
# Check service status
curl https://api.agenttownsquare.com/v1/notary/status

# Get a cryptographically signed sample receipt
curl https://api.agenttownsquare.com/v1/notary/sample-receipt

# Verify any receipt
curl -X POST https://api.agenttownsquare.com/v1/notary/verify \
  -H "Content-Type: application/json" \
  -d '{"receipt": <paste receipt from above>}'
```

## SDKs

Install the SDK for your language — all zero-dependency:

| Language | Install | Docs |
|----------|---------|------|
| **TypeScript** | `npm install notaryos` | [sdk/typescript/](sdk/typescript/) |
| **Python** | `pip install notaryos` | [sdk/python/](sdk/python/) |
| **Go** | `go get github.com/hellothere012/notaryos-go` | [sdk/go/](sdk/go/) |

### Python

```python
from notaryos import NotaryClient

notary = NotaryClient()
receipt = notary.get_sample_receipt()
result = notary.verify(receipt)
print(f"Valid: {result.valid}")
```

### TypeScript

```typescript
import { NotaryClient } from 'notaryos';

const notary = new NotaryClient();
const receipt = await notary.getSampleReceipt();
const result = await notary.verify(receipt);
console.log(`Valid: ${result.valid}`);
```

### Go

```go
client := notary.NewClient(notary.DefaultConfig())
receipt, _ := client.SampleReceipt(ctx)
result, _ := client.Verify(ctx, receipt)
fmt.Printf("Valid: %v\n", result.Valid)
```

## How It Works

```
Agent A sends message to Agent B
         │
         ▼
┌─────────────────────────┐
│     NotaryOS Engine      │
│                         │
│  1. Hash the payload    │
│  2. Chain to previous   │
│  3. Sign with HMAC/Ed25519│
│  4. Return receipt      │
└─────────────────────────┘
         │
         ▼
Both agents receive a tamper-evident receipt
```

Each receipt contains:
- **SHA-256 hash** of the original payload (privacy-preserving — the actual message is never stored)
- **Previous receipt hash** linking to a chain (like a mini-blockchain per agent pair)
- **Cryptographic signature** (HMAC-SHA256 or Ed25519)
- **Timestamp**, agent IDs, and capability metadata

If any receipt in the chain is modified, verification fails at that point — pinpointing the exact tampered receipt.

## Verification UI

A React-based verification interface is included for public receipt verification:

```bash
cd ui
npm install
npm start
```

See the [live verification page](https://notaryos.org/verify).

## Documentation

| Document | Description |
|----------|-------------|
| [Quick Start](docs/QUICKSTART.md) | Get running in 5 minutes |
| [User Manual](docs/USER_MANUAL.md) | Complete usage guide |
| [Technical Manual](docs/TECHNICAL_MANUAL.md) | Full specification and architecture |
| [SDK Examples](docs/SDK_EXAMPLES.md) | API reference with code examples |
| [Independent Verification](docs/INDEPENDENT_VERIFICATION.md) | Offline chain verification guide |

## API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/v1/notary/status` | GET | None | Service health |
| `/v1/notary/sample-receipt` | GET | None | Generate demo receipt |
| `/v1/notary/verify` | POST | None | Verify any receipt |
| `/v1/notary/issue` | POST | API Key | Create a signed receipt |
| `/v1/notary/public-key` | GET | None | Get verification public key |

**Base URL:** `https://api.agenttownsquare.com`

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

See [Configuration Reference](docs/TECHNICAL_MANUAL.md#12-configuration-reference) for all options.

## Security Properties

| Property | Implementation |
|----------|----------------|
| **Authenticity** | HMAC-SHA256 / Ed25519 signatures |
| **Integrity** | SHA-256 hash chain |
| **Non-repudiation** | Server-held signing keys with audit trail |
| **Privacy** | Only message hashes stored, never payloads |
| **Tamper detection** | Chain verification pinpoints modified receipts |

## Architecture

NotaryOS follows a **razor-and-blade** model:

- **Open source** (this repo): SDKs, verification UI, documentation, examples
- **Proprietary**: The signing engine, abuse detection, and API backend

Verification is free and works offline (via SDKs). Receipt creation requires an API key.

## Pricing

| Tier | Receipts/month | Rate Limit | Price |
|------|---------------|------------|-------|
| **Starter** | 100 | 60/min | $0 |
| **Explorer** | 10,000 | 300/min | $59/mo |
| **Pro** | 100,000 | 1,000/min | $159/mo |
| **Enterprise** | Unlimited | Custom | Custom |

See [Pricing Details](docs/TECHNICAL_MANUAL.md#15-pricing-and-tiers).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License. See [LICENSE](LICENSE).

---

**NotaryOS** is built by [Agent Town Square](https://agenttownsquare.com).
