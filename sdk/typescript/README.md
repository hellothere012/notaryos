# NotaryOS SDK for TypeScript

Cryptographic receipts for AI agent actions. Issue, verify, and audit agent behavior with Ed25519 signatures.

**Zero dependencies.** Uses native `fetch()` and Web Crypto API. Works in Node 18+, Deno, Bun, and modern browsers.

## Install

```bash
npm install notaryos
```

## Quick Start

### Issue a Receipt (3 lines)

```typescript
import { NotaryClient } from 'notaryos';

const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });
const receipt = await notary.issue('data_processing', { key: 'value' });
console.log(receipt.verify_url); // https://api.agenttownsquare.com/v1/notary/r/abc123
```

### Verify a Receipt (no API key needed)

```typescript
import { verifyReceipt } from 'notaryos';

const isValid = await verifyReceipt(receiptJson);
// true
```

### Full Example

```typescript
import { NotaryClient } from 'notaryos';

const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });

// Issue a receipt for an agent action
const receipt = await notary.issue('financial.transfer', {
  from: 'billing-agent',
  to: 'ledger-agent',
  amount: 150.00,
  currency: 'USD',
});

// Verify it
const result = await notary.verify(receipt);
console.log(result.valid);        // true
console.log(result.signature_ok); // true

// Check service health
const status = await notary.status();
console.log(status.status); // "active"

// Get public key for offline verification
const keyInfo = await notary.publicKey();
console.log(keyInfo.public_key_pem);
```

## API Reference

### `NotaryClient`

| Method | Auth | Description |
|--------|------|-------------|
| `issue(actionType, payload, options?)` | API Key | Issue a signed receipt |
| `verify(receipt)` | API Key | Verify a receipt |
| `verifyById(receiptId)` | API Key | Verify by receipt ID |
| `status()` | API Key | Service health check |
| `publicKey()` | API Key | Get Ed25519 public key |
| `me()` | API Key | Authenticated agent info |

### `verifyReceipt(receipt, baseUrl?)`

Public verification without API key. Returns `boolean`.

### `computeHash(payload)`

SHA-256 hash matching server-side computation. Returns hex string.

## Configuration

```typescript
const notary = new NotaryClient({
  apiKey: 'notary_live_xxx',     // Required
  baseUrl: 'https://...',        // Default: https://api.agenttownsquare.com
  timeout: 30_000,               // Default: 30s
  maxRetries: 2,                 // Default: 2
});
```

## Error Handling

```typescript
import { NotaryClient, AuthenticationError, RateLimitError, ValidationError } from 'notaryos';

try {
  const receipt = await notary.issue('action', payload);
} catch (err) {
  if (err instanceof AuthenticationError) {
    // Invalid API key
  } else if (err instanceof RateLimitError) {
    // Wait err.retryAfter seconds
  } else if (err instanceof ValidationError) {
    // Check err.details
  }
}
```

## Get an API Key

1. Sign up at [notaryos.org](https://notaryos.org)
2. Generate an API key from the dashboard
3. Keys start with `notary_live_` (production) or `notary_test_` (sandbox)

## Links

- [NotaryOS Documentation](https://notaryos.org/docs)
- [API Reference](https://api.agenttownsquare.com/v1/notary/status)
- [Public Verification](https://notaryos.org/verify)

## License

MIT
