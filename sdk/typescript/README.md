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

## API Reference

### `NotaryClient`

| Method | Auth | Description |
|--------|------|-------------|
| `issue(actionType, payload, options?)` | API Key | Issue a signed receipt |
| `verify(receipt)` | Public | Verify a receipt |
| `verifyById(receiptId)` | API Key | Verify by receipt ID |
| `status()` | Public | Service health check |
| `publicKey()` | Public | Get Ed25519 public key |
| `me()` | API Key | Authenticated agent info |
| `lookup(receiptHash)` | Public | Look up receipt by hash |
| `history(options?)` | Clerk JWT | Paginated receipt history |
| `provenance(receiptHash)` | Public | Provenance DAG report |
| `wrap(obj, config?)` | API Key | Auto-receipt wrapping |

### `notary.counterfactual.*`

| Method | Auth | Description |
|--------|------|-------------|
| `issue(options)` | API Key | Issue v1 counterfactual |
| `get(receiptHash)` | Public | Verify counterfactual |
| `listByAgent(agentId)` | Public | List agent's counterfactuals |
| `commit(options)` | API Key | v2 commit phase |
| `reveal(hash, plaintext)` | API Key | v2 reveal phase |
| `commitStatus(hash)` | Public | Check commit-reveal status |
| `corroborate(hash, signals)` | API Key | Counter-sign |
| `certificate(hash, format?)` | Public | Compliance certificate |
| `verifyChain(agentId)` | Public | Chain continuity |

### Standalone Functions

| Function | Description |
|----------|-------------|
| `verifyReceipt(receipt, baseUrl?)` | Public verification (returns boolean) |
| `computeHash(payload)` | SHA-256 matching server-side hashing |

### Error Codes

```typescript
import { NotaryErrorCode } from 'notaryos';

NotaryErrorCode.ERR_RECEIPT_NOT_FOUND   // 404
NotaryErrorCode.ERR_INVALID_API_KEY     // 401
NotaryErrorCode.ERR_RATE_LIMIT_EXCEEDED // 429
NotaryErrorCode.ERR_CHAIN_BROKEN        // 400
// ... 16 total error codes
```

## Auto-Receipting

```typescript
const agent = notary.wrap(myAgent, { mode: 'all', fireAndForget: true });
await agent.processData(input); // auto-receipted!
```

Options: `mode` (`'all'` | `'errors_only'` | `'sample'`), `sampleRate`, `fireAndForget`, `dryRun`.

## Counterfactual Receipts

```typescript
// v1: Direct issuance
const stamp = await notary.counterfactual.issue({
  actionNotTaken: 'delete_user_data',
  capabilityProof: { scope: 'data:delete', granted: true },
  opportunityContext: { user_id: 'u_123' },
  decisionReason: 'GDPR retention period not yet expired',
});

// v2: Commit-reveal
const commit = await notary.counterfactual.commit({ ...options });
const reveal = await notary.counterfactual.reveal(hash, plaintext);
```

## Offline Verification

```typescript
import { OfflineVerifier } from 'notaryos/offline';

const verifier = await OfflineVerifier.fromJWKS();
const result = await verifier.verify(receipt);
console.log(result.valid); // true — no API call needed
```

## Framework Integrations

### Vercel AI SDK

```typescript
import { notaryMiddleware } from 'notaryos/integrations/vercel-ai';
```

### LangChain.js

```typescript
import { NotaryCallbackHandler } from 'notaryos/integrations/langchain';
const handler = new NotaryCallbackHandler(notary);
```

### OpenAI Agents

```typescript
import { notaryToolWrapper } from 'notaryos/integrations/openai-agents';
const wrappedTool = notaryToolWrapper(notary, myToolFn, 'my_tool');
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

## Configuration

```typescript
const notary = new NotaryClient({
  apiKey: 'notary_live_xxx',     // Required
  baseUrl: 'https://...',        // Default: https://api.agenttownsquare.com
  timeout: 30_000,               // Default: 30s
  maxRetries: 2,                 // Default: 2
});
```

## License

BUSL-1.1
