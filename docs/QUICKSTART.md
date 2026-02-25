# NotaryOS Quick Start Guide

**Get cryptographic receipts for your AI agent actions in 3 lines of code.**

---

## What is NotaryOS?

NotaryOS stamps every AI agent action with a cryptographic receipt. Each receipt proves **what** happened, **who** did it, **when**, and that **nothing was tampered with**. Any third party can verify a receipt using only a public key -- no server access needed.

---

## Step 1: Get a Sample Receipt

No setup required. Try it right now:

```bash
curl https://api.agenttownsquare.com/v1/notary/sample-receipt
```

You'll get a live, cryptographically signed receipt. This is a real stamp -- signed with the production key.

---

## Step 2: Verify It

Take the `receipt` object from Step 1 (the value inside the `"receipt"` key -- not the whole response) and verify it:

```bash
curl -X POST https://api.agenttownsquare.com/v1/notary/verify \
  -H "Content-Type: application/json" \
  -d '{"receipt": <paste the receipt object from the "receipt" field>}'
```

Or pipe it in one shot:

```bash
curl -s https://api.agenttownsquare.com/v1/notary/sample-receipt \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print(json.dumps({'receipt':r['receipt']}))" \
  | curl -X POST https://api.agenttownsquare.com/v1/notary/verify \
      -H "Content-Type: application/json" -d @-
```

Response:
```json
{
  "valid": true,
  "signature_ok": true,
  "structure_ok": true,
  "chain_ok": true,
  "reason": "Receipt verified successfully",
  "details": {
    "receipt_id": "receipt_demo_...",
    "signature_type": "ed25519",
    "key_id": "ed25519-key-v1",
    "verification_method": "local_signer"
  }
}
```

---

## Step 3: One-Line Setup

### Python
```bash
pip install requests  # or use stdlib urllib (zero dependencies)
```

### TypeScript
Zero dependencies -- uses native `fetch()`.

### Go
Zero dependencies -- uses `net/http`.

---

## Step 4: Issue Your First Receipt (3 Lines)

### Python

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="your_api_key_here")  # Get one at https://notaryos.org/api-keys
receipt = notary.issue("my_action", {"message": "Transfer approved", "amount": 500})
```

That's it. **Three lines of code.** Your AI agent's action now has a cryptographic proof of existence.

### TypeScript

```typescript
import { NotaryClient } from 'notaryos';

const notary = new NotaryClient({ apiKey: 'your_api_key_here' });  // Get one at https://notaryos.org/api-keys
const receipt = await notary.issue('my_action', { message: 'Transfer approved', amount: 500 });
```

### Go

```go
client, _ := notary.NewClient("your_api_key_here", nil)  // Get one at https://notaryos.org/api-keys
receipt, _ := client.Issue("my_action", map[string]any{"message": "Transfer approved", "amount": 500})
```

---

## Step 5: Verify Your Receipt

### Python

```python
# Server verification (one line)
result = notary.verify(receipt)
print(result.valid)   # True
print(result.reason)  # "Receipt signature and structure verified successfully"
```

### TypeScript

```typescript
const result = await notary.verify(receipt);
console.log(result.valid);  // true
```

### Go

```go
result, _ := client.Verify(receipt)
fmt.Println(result.Valid)  // true
```

---

## Understanding Your Receipt

Every receipt contains these key fields:

```
+-------------------------------------------------------------------+
|  RECEIPT: ntry_20260212_001_abc123def456                           |
+-------------------------------------------------------------------+
|  Agent:        my-agent                                            |
|  Action:       my_action                                           |
|  Timestamp:    2026-02-12T08:49:00.123456+00:00                   |
|  Payload:      SHA-256 hash of your payload (not the payload)      |
|  Chain:        Links to this agent's previous receipt               |
|  Signature:    Ed25519 cryptographic signature                     |
+-------------------------------------------------------------------+
```

- **receipt_id**: Unique identifier for this receipt
- **payload_hash**: SHA-256 of your payload -- proves the exact content
- **previous_receipt_hash**: Links to the prior receipt, creating an ordered chain
- **signature**: Ed25519 proof that this receipt is authentic

---

## Key Concepts in 60 Seconds

### Hash Chain
Every agent has its own chain of receipts, linked by hashes. If any receipt is modified, the chain breaks -- tampering is immediately detectable.

### Offline Verification
Anyone with the public key can verify any receipt. No server needed. No API key needed. Get the public key once:

```bash
curl https://api.agenttownsquare.com/v1/notary/public-key
```

### Public Receipt Lookup
Look up any receipt by its hash:

```bash
curl https://api.agenttownsquare.com/v1/notary/r/{receipt_hash}
```

---

## API Quick Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/v1/notary/sample-receipt` | GET | None | Get demo receipt |
| `/v1/notary/verify` | POST | None | Verify a receipt |
| `/v1/notary/public-key` | GET | None | Get Ed25519 public key |
| `/v1/notary/status` | GET | None | Health check |
| `/v1/notary/r/{hash}` | GET | None | Look up receipt by hash |
| `/v1/notary/issue` | POST | API Key | Issue a receipt |
| `/v1/notary/agents/me` | GET | API Key | Your agent info |
| `/v1/notary/agents/register` | POST | Rate-limited | Register new agent |
| `/.well-known/jwks.json` | GET | None | JWKS for key rotation |

Base URL: `https://api.agenttownsquare.com`

---

## Plans

| | Starter ($0) | Explorer ($59/mo) | Pro ($159/mo) | Enterprise |
|-|--------------|-------------------|---------------|------------|
| Receipts/month | 100 | 10,000 | 100,000 | Unlimited |
| Rate limit | 60/min | 300/min | 1,000/min | Custom |
| Hash chains | -- | Yes | Yes | Yes |
| Provenance tracking | -- | Yes | Yes | Yes |
| Counterfactual receipts | -- | -- | Yes | Yes |

Start free with the Starter tier. Upgrade when you're ready.

---

## Next Steps

- **User Manual**: `docs/USER_MANUAL.md` -- complete integration guide
- **Technical Manual**: `docs/TECHNICAL_MANUAL.md` -- deep dive into cryptography and architecture
- **Examples**: `examples/` -- runnable Python examples for verification, chain audit, and third-party audit
- **API Docs**: `https://api.agenttownsquare.com/api/docs`

---

*NotaryOS Quick Start v1.5.21 | notaryos.org*
