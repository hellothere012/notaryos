# NotaryOS SDKs

Official SDKs for [NotaryOS](https://notaryos.org) — cryptographic receipts for AI agent actions.

## Available SDKs

| Language | Package | Install | Deps |
|----------|---------|---------|------|
| **TypeScript** | [`notaryos`](typescript/) | `npm install notaryos` | Zero (native fetch + Web Crypto) |
| **Python** | [`notaryos`](python/) | `pip install notaryos` | Zero (stdlib urllib + hashlib) |
| **Go** | `notaryos-go` | Coming soon | Zero (stdlib net/http) |

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

## SDK v2.0 Features

### Core API (all SDKs)
- **Issue** — Create signed receipts for agent actions
- **Verify** — Verify receipt signatures and integrity
- **Lookup** — Public receipt lookup by hash
- **History** — Paginated receipt history (Clerk JWT auth)
- **Provenance** — DAG provenance reports for receipt chains
- **Compute Hash** — Client-side SHA-256 matching server hashing
- **Error Codes** — 16 standardized error constants

### Counterfactual Receipts (Enterprise)
- **v1 Issue** — Proof of non-action (agent chose not to act)
- **v2 Commit-Reveal** — Temporal binding with delayed reveal
- **Corroboration** — Multi-agent counter-signing
- **Compliance Certificates** — Human-readable audit documents
- **Chain Verification** — Per-agent chain continuity checks

### Auto-Receipting
- **Python** — `notary.wrap(agent)` + `@receipted(notary)` decorator
- **TypeScript** — `notary.wrap(agent)` via ES6 Proxy
- **Go** — `ReceiptQueue` + `RecordAction()` helper

### Offline Verification (Optional Modules)
- **Python** — `notary_offline.py` (requires `cryptography`)
- **TypeScript** — `offline.ts` (Web Crypto API, zero-dep)
- **Go** — `offline.go` (stdlib `crypto/ed25519`)

### Framework Integrations

#### Python (9 frameworks)

| Framework | Import | Pattern |
|-----------|--------|---------|
| **LangChain** | `from notaryos.integrations.langchain import NotaryCallbackHandler` | Callback handler |
| **CrewAI** | `from notaryos.integrations.crewai import notary_task_callback` | Task decorator |
| **OpenAI Agents** | `from notaryos.integrations.openai_agents import NotaryGuardrail` | Guardrail |
| **PydanticAI** | `from notaryos.integrations.pydantic_ai import notary_tool` | Tool decorator |
| **Anthropic Claude** | `from notaryos.integrations.anthropic_claude import NotaryToolUseHook` | Tool use hook |
| **Google ADK** | `from notaryos.integrations.google_adk import NotaryADKCallback` | Callback |
| **LlamaIndex** | `from notaryos.integrations.llamaindex import NotaryCallbackHandler` | Callback handler |
| **AWS Bedrock** | `from notaryos.integrations.aws_bedrock import NotaryBedrockHook` | Response hook |
| **SmolAgents** | `from notaryos.integrations.smolagents import NotarySmolCallback` | Callback |

#### TypeScript (3 frameworks)

| Framework | Import | Pattern |
|-----------|--------|---------|
| **Vercel AI SDK** | `from 'notaryos/integrations/vercel-ai'` | Middleware |
| **LangChain.js** | `from 'notaryos/integrations/langchain'` | Callback handler |
| **OpenAI Agents** | `from 'notaryos/integrations/openai-agents'` | Tool wrapper |

## API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /v1/notary/issue` | API Key | Issue signed receipt |
| `POST /v1/notary/verify` | Public | Verify receipt |
| `GET /v1/notary/r/{hash}` | Public | Look up receipt |
| `GET /v1/notary/r/{hash}/provenance` | Public | Provenance DAG report |
| `GET /v1/notary/history` | Clerk JWT | Receipt history |
| `GET /v1/notary/status` | Public | Service health |
| `GET /v1/notary/public-key` | Public | Ed25519 public key |
| `GET /.well-known/jwks.json` | Public | JWKS key set |
| `POST /v1/notary/counterfactual/issue` | API Key | Counterfactual receipt |
| `POST /v1/notary/counterfactual/commit` | API Key | Commit-reveal Phase 1 |
| `POST /v1/notary/counterfactual/reveal` | API Key | Commit-reveal Phase 2 |
| `POST /v1/notary/counterfactual/corroborate` | API Key | Counter-sign |

## Get an API Key

1. Sign up at [notaryos.org](https://notaryos.org)
2. Generate an API key from the dashboard
3. Keys: `notary_live_xxx` (production) or `notary_test_xxx` (sandbox)

## License

BUSL-1.1 - See [LICENSE](LICENSE)
