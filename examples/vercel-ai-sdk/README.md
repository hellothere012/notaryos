# NotaryOS + Vercel AI SDK

[![NotaryOS Verified](https://img.shields.io/badge/NotaryOS-Verified-green?logo=shield)](https://notaryos.org)
[![Tested in CI](https://img.shields.io/github/actions/workflow/status/hellothere012/notaryos/integration-tests.yml?label=CI)](https://github.com/hellothere012/notaryos/actions)

Edge-deployed agents, edge-verified receipts.

## Quick Start

```bash
npm install
export NOTARY_API_KEY="notary_live_YOUR_KEY"
npx tsx index.ts
```

## How It Works

The NotaryOS TypeScript SDK issues receipts in Vercel AI SDK tool callbacks. Each tool invocation gets a signed receipt with zero latency overhead (fire-and-forget).

```typescript
import { NotaryClient } from 'notaryos';

const notary = new NotaryClient({ apiKey: 'notary_live_xxx' });

// Inside your tool callback:
await notary.issue({ actionType: 'search', payload: { query } });
```

## Running Tests

```bash
npm test
```
