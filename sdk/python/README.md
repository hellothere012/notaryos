# NotaryOS SDK for Python

Cryptographic receipts for AI agent actions. Issue, verify, and audit agent behavior with Ed25519 signatures.

**Zero external dependencies.** Uses only Python standard library (`urllib`, `hashlib`, `json`). Python 3.8+.

## Install

```bash
pip install notaryos
```

## Quick Start

### Issue a Receipt (3 lines)

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")
receipt = notary.issue("data_processing", {"key": "value"})
print(receipt.verify_url)  # https://api.agenttownsquare.com/v1/notary/r/abc123
```

### Verify a Receipt (no API key needed)

```python
from notaryos import verify_receipt

is_valid = verify_receipt(receipt_dict)
# True
```

## API Reference

### `NotaryClient(api_key, base_url=None, timeout=30, max_retries=2)`

| Method | Auth | Description |
|--------|------|-------------|
| `issue(action_type, payload, ...)` | API Key | Issue a signed receipt |
| `verify(receipt)` | API Key | Verify a receipt |
| `verify_by_id(receipt_id)` | API Key | Verify by receipt ID |
| `status()` | API Key | Service health check |
| `public_key()` | API Key | Get Ed25519 public key |
| `me()` | API Key | Authenticated agent info |
| `lookup(receipt_hash)` | Public | Look up receipt by hash |
| `history(options)` | Clerk JWT | Paginated receipt history |
| `provenance(receipt_hash)` | Public | Provenance DAG report |
| `wrap(obj, config=None)` | — | Auto-receipt all public methods |
| `unwrap(obj)` | — | Restore original methods |
| `receipt_stats` | — | Get queue stats (property) |

### `notary.counterfactual.*`

| Method | Auth | Description |
|--------|------|-------------|
| `issue(options)` | API Key | Issue v1 counterfactual |
| `get(receipt_hash)` | Public | Verify counterfactual |
| `list_by_agent(agent_id, limit, offset)` | Public | List agent's counterfactuals |
| `commit(options)` | API Key | v2 commit phase |
| `reveal(hash, plaintext)` | API Key | v2 reveal phase |
| `commit_status(hash)` | Public | Check commit-reveal status |
| `corroborate(hash, signals)` | API Key | Counter-sign |
| `certificate(hash, format)` | Public | Compliance certificate |
| `verify_chain(agent_id)` | Public | Chain continuity |

### `notary.admin.*`

| Method | Auth | Description |
|--------|------|-------------|
| `invalidate(receipt_hash, reason)` | Admin | Invalidate a receipt |

### Standalone Functions

| Function | Description |
|----------|-------------|
| `verify_receipt(receipt, base_url)` | Public verification (returns bool) |
| `NotaryClient.compute_hash(payload)` | SHA-256 matching server-side hashing |

### Error Code Constants

```python
from notaryos import NotaryErrorCode

NotaryErrorCode.ERR_RECEIPT_NOT_FOUND     # 404
NotaryErrorCode.ERR_INVALID_API_KEY       # 401
NotaryErrorCode.ERR_RATE_LIMIT_EXCEEDED   # 429
NotaryErrorCode.ERR_CHAIN_BROKEN          # 400
# ... 16 total error codes
```

## Counterfactual Receipts

Proof that an agent *chose not to act* — critical for compliance and audit trails.

```python
cf = notary.counterfactual

# v1: Direct issuance
stamp = cf.issue(
    action_not_taken="delete_user_data",
    capability_proof={"scope": "data:delete", "granted": True},
    opportunity_context={"user_id": "u_123"},
    decision_reason="GDPR retention period not yet expired",
)

# v2: Commit-reveal (temporal binding)
commit = cf.commit(
    action_not_taken="execute_trade",
    capability_proof={"scope": "trade:execute"},
    decision_hash="sha256_of_reason",
)
reveal = cf.reveal(commit["receipt_hash"], "Market volatility exceeded threshold")

# Corroboration (multi-agent counter-signing)
result = cf.corroborate(receipt_hash, signals=["log_entry", "witness_agent"])

# Query
status = cf.commit_status(receipt_hash)
cert = cf.certificate(receipt_hash, format="markdown")
chain = cf.verify_chain(agent_id)
history = cf.list_by_agent(agent_id)
```

## Auto-Receipting

Wrap any agent so every public method call automatically produces a receipt.

```python
from notaryos import NotaryClient, AutoReceiptConfig

notary = NotaryClient(api_key="notary_live_xxx")

class MyAgent:
    def place_order(self, symbol, qty):
        return {"order_id": "123", "symbol": symbol, "qty": qty}

agent = MyAgent()
notary.wrap(agent)  # Every public method now auto-receipts

agent.place_order("BTC", 10)    # Receipt issued automatically
```

### Class Decorator

```python
from notaryos import NotaryClient, receipted

notary = NotaryClient(api_key="notary_live_xxx")

@receipted(notary)
class TradingBot:
    def trade(self, symbol, amount):
        return execute_trade(symbol, amount)

bot = TradingBot()
bot.trade("ETH", 5)  # Receipt issued
```

### Configuration

```python
config = AutoReceiptConfig(
    mode="all",          # "all", "errors_only", or "sample"
    sample_rate=0.5,     # Sample 50% of calls (for "sample" mode)
    fire_and_forget=True, # Non-blocking (background thread)
    dry_run=False,       # Set True to log without issuing
    redact_secrets=True, # Redact args matching secret patterns
)
notary.wrap(agent, config=config)
```

## History & Provenance

```python
# Paginated receipt history (requires Clerk JWT)
history = notary.history(clerk_token="clerk_jwt_xxx", page=1, page_size=20)

# Provenance DAG report
report = notary.provenance("receipt_hash_abc123")
```

## Offline Verification

Verify receipts locally without API calls using Ed25519 public keys from JWKS.

```python
from notary_offline import OfflineVerifier

verifier = OfflineVerifier.from_jwks()
result = verifier.verify(receipt_dict)
print(result["valid"])   # True
print(result["key_id"])  # Key ID used for verification
```

Requires `cryptography` library: `pip install cryptography`

## Framework Integrations

### LangChain

```python
from notaryos.integrations.langchain import NotaryCallbackHandler

handler = NotaryCallbackHandler(notary)
chain.invoke(input, config={"callbacks": [handler]})
```

### CrewAI

```python
from notaryos.integrations.crewai import notary_task_callback

@notary_task_callback(notary)
def my_task(agent, task):
    return agent.execute(task)
```

### OpenAI Agents

```python
from notaryos.integrations.openai_agents import NotaryGuardrail

guardrail = NotaryGuardrail(notary)
agent = Agent(guardrails=[guardrail])
```

### PydanticAI

```python
from notaryos.integrations.pydantic_ai import notary_tool

@notary_tool(notary)
def my_tool(ctx, query: str) -> str:
    return process(query)
```

### Anthropic Claude

```python
from notaryos.integrations.anthropic_claude import NotaryToolUseHook

hook = NotaryToolUseHook(notary)
```

### Google ADK

```python
from notaryos.integrations.google_adk import NotaryADKCallback

callback = NotaryADKCallback(notary)
```

### LlamaIndex

```python
from notaryos.integrations.llamaindex import NotaryCallbackHandler

handler = NotaryCallbackHandler(notary)
```

### AWS Bedrock

```python
from notaryos.integrations.aws_bedrock import NotaryBedrockHook

hook = NotaryBedrockHook(notary)
```

### SmolAgents

```python
from notaryos.integrations.smolagents import NotarySmolCallback

callback = NotarySmolCallback(notary)
```

## Error Handling

```python
from notaryos import NotaryClient, AuthenticationError, RateLimitError, ValidationError

try:
    receipt = notary.issue("action", payload)
except AuthenticationError:
    # Invalid API key
    pass
except RateLimitError as e:
    # Wait e.retry_after seconds
    pass
except ValidationError:
    # Check error details
    pass
```

## Configuration

```python
notary = NotaryClient(
    api_key="notary_live_xxx",           # Required
    base_url="https://...",              # Default: https://api.agenttownsquare.com
    timeout=30,                          # Default: 30s
    max_retries=2,                       # Default: 2
)
```

## CLI

```bash
notaryos status                          # Check service status
notaryos issue notary_live_xxx my_action # Issue a receipt
notaryos verify '{"receipt_id": "..."}' # Verify a receipt
notaryos lookup abc123def456             # Look up by hash
```

## License

MIT
