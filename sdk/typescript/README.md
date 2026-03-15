# NotaryOS SDK for TypeScript

Cryptographic receipts for AI agent actions. Seal, verify, and audit agent behavior with Ed25519 signatures.

**Zero dependencies.** Uses native `fetch()` and Web Crypto API. Works in Node 18+, Deno, Bun, and modern browsers.

## Install

```bash
npm install notaryos
```

## Quick Start

### Seal an Action (3 lines)

```typescript
import { NotaryClient } from 'notaryos';

const notary = new NotaryClient();
const receipt = await notary.seal('data_processing', { key: 'value' });
console.log(receipt.receiptHash);   // "abc123..."
console.log(receipt.verifyUrl);     // https://api.agenttownsquare.com/v1/notary/r/abc123
console.log(receipt.chainSequence); // 1
```

The zero-argument constructor uses a built-in demo key. Pass your production key when you are ready to go live:

```typescript
const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });
```

### Verify a Receipt (no API key needed)

```typescript
import { verifyReceipt } from 'notaryos';

const isValid = await verifyReceipt(receiptJson);
// true
```

### Full Round-Trip

```typescript
import { NotaryClient, verifyReceipt } from 'notaryos';

const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });

// 1. Seal an action
const receipt = await notary.seal('model_inference', {
  model: 'gpt-4',
  prompt_hash: 'sha256:...',
  tokens: 1542,
});

// 2. Verify server-side
const result = await notary.verify(receipt);
console.log(result.valid);        // true
console.log(result.signatureOk);  // true
console.log(result.structureOk);  // true
console.log(result.chainOk);      // true

// 3. Or verify standalone (no auth)
const ok = await verifyReceipt(receipt.toJSON());
console.log(ok); // true
```

## API Reference

### `NotaryClient`

| Method | Auth Required | Returns | Description |
|--------|---------------|---------|-------------|
| `seal(actionType, payload, options?)` | API Key | `Receipt` | Seal an action with a signed receipt |
| `issue(actionType, payload, options?)` | API Key | `Receipt` | Alias for `seal()` |
| `verify(receipt)` | No | `VerificationResult` | Verify a receipt object |
| `verifyById(receiptId)` | API Key | `VerificationResult` | Verify by receipt ID |
| `lookup(receiptHash)` | No | `object` | Look up a receipt by its hash |
| `status()` | No | `ServiceStatus` | Service health check |
| `publicKey()` | No | `object` | Get the server's Ed25519 public key |
| `me()` | API Key | `object` | Get authenticated agent info |

### Standalone Functions

| Function | Description |
|----------|-------------|
| `verifyReceipt(receipt, baseUrl?)` | Verify a receipt without authentication (returns `boolean`) |
| `computeHash(payload)` | Compute SHA-256 hash matching server-side algorithm |

### Types

**`Receipt`**

| Property | Type | Description |
|----------|------|-------------|
| `receiptHash` | `string` | Unique hash identifying this receipt |
| `signature` | `string` | Ed25519 signature (base64url) |
| `chainSequence` | `number` | Position in the agent's hash chain |
| `verifyUrl` | `string` | Public URL to verify this receipt |
| `toJSON()` | `() => object` | Serialize to plain object |

**`VerificationResult`**

| Property | Type | Description |
|----------|------|-------------|
| `valid` | `boolean` | Overall verification result |
| `signatureOk` | `boolean` | Ed25519 signature is valid |
| `structureOk` | `boolean` | Receipt structure is well-formed |
| `chainOk` | `boolean` | Hash chain is intact |
| `reason` | `string` | Human-readable explanation |
| `details` | `object` | Additional verification metadata |

**`ServiceStatus`**

| Property | Type | Description |
|----------|------|-------------|
| `status` | `string` | Current service status |
| `signatureType` | `string` | Signature algorithm in use (Ed25519) |

### Constants

| Export | Value | Description |
|--------|-------|-------------|
| `SDK_VERSION` | `"2.2.0"` | Current SDK version |

## Error Handling

All errors extend the base `NotaryError` class:

```typescript
import {
  NotaryClient,
  NotaryError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
} from 'notaryos';

const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });

try {
  const receipt = await notary.seal('action', { key: 'value' });
} catch (err) {
  if (err instanceof AuthenticationError) {
    // Invalid or expired API key (HTTP 401)
  } else if (err instanceof RateLimitError) {
    // Too many requests (HTTP 429) — back off and retry
  } else if (err instanceof ValidationError) {
    // Malformed request — check err.message for details
  } else if (err instanceof NotaryError) {
    // Any other NotaryOS API error
  }
}
```

## Configuration

```typescript
const notary = new NotaryClient({
  apiKey: 'notary_live_xxx',     // Omit to use built-in demo key
  baseUrl: 'https://...',        // Default: https://api.agenttownsquare.com
  timeout: 30_000,               // Default: 30s
  maxRetries: 2,                 // Default: 2
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | Demo key | Your `notary_live_` or `notary_test_` API key |
| `baseUrl` | `string` | `https://api.agenttownsquare.com` | API base URL |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `maxRetries` | `number` | `2` | Number of automatic retries on transient failures |

## License

BUSL-1.1
