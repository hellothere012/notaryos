# NotaryOS SDKs

Official SDKs for [NotaryOS](https://notaryos.org) — cryptographic receipts for AI agent actions.

## Available SDKs

| Language | Package | Install | Deps |
|----------|---------|---------|------|
| **TypeScript** | [`notaryos`](typescript/) | `npm install notaryos` | Zero (native fetch + Web Crypto) |
| **Python** | [`notaryos`](python/) | `pip install notaryos` | Zero (stdlib urllib + hashlib) |
| **Go** | [`notaryos-go`](go/) | `go get github.com/hellothere012/notaryos-go/notary` | Zero (stdlib net/http) |

## 3-Line Quick Start

### TypeScript

```typescript
import { NotaryClient } from 'notaryos';
const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });
const receipt = await notary.issue('my_action', { key: 'value' });
```

### Python

```python
from notaryos import NotaryClient
notary = NotaryClient(api_key="notary_live_xxx")
receipt = notary.issue("my_action", {"key": "value"})
```

### Go

```go
client, _ := notary.NewClient("notary_live_xxx", nil)
receipt, _ := client.Issue("my_action", map[string]any{"key": "value"})
```

## Verify Without API Key

All SDKs support public verification without authentication:

```typescript
// TypeScript
import { verifyReceipt } from 'notaryos';
const isValid = await verifyReceipt(receiptJson);
```

```python
# Python
from notaryos import verify_receipt
is_valid = verify_receipt(receipt_dict)
```

```go
// Go
isValid, _ := notary.VerifyReceipt(receiptMap, "")
```

## Architecture

```
You (Developer)                    NotaryOS (Service)
===============                    ==================

  SDK (open source)        -->     Signing Engine (proprietary)
  - issue()                        - Ed25519 signing
  - verify()                       - Hash chain management
  - status()                       - Abuse detection
                                   - Key rotation

  Verification is FREE             Signing is PAID
  and works offline                and requires API key
```

## API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /v1/notary/issue` | API Key | Issue signed receipt |
| `POST /v1/notary/verify` | Public | Verify receipt |
| `GET /v1/notary/r/{hash}` | Public | Look up receipt |
| `GET /v1/notary/status` | Public | Service health |
| `GET /v1/notary/public-key` | Public | Ed25519 public key |
| `GET /.well-known/jwks.json` | Public | JWKS key set |

## Get an API Key

1. Sign up at [notaryos.org](https://notaryos.org)
2. Generate an API key from the dashboard
3. Keys: `notary_live_xxx` (production) or `notary_test_xxx` (sandbox)

## License

MIT - See [LICENSE](LICENSE)
