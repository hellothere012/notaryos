# NotaryOS SDK for Python

Cryptographic receipts for AI agent actions. Issue, verify, and audit agent behavior with Ed25519 signatures.

**Zero external dependencies.** Uses only Python standard library (`urllib`, `hashlib`, `json`). Python 3.8+.

## Install

```bash
pip install notaryos
```

## Quick Start

### Seal an Action (3 lines)

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")
receipt = notary.seal("data_processing", "MyAgent-v1", {"key": "value"})
print(receipt.verify_url)  # https://api.agenttownsquare.com/v1/notary/r/abc123
```

### Verify a Receipt (no API key needed)

```python
from notaryos import verify_receipt

is_valid = verify_receipt(receipt_dict)
# True
```

### Detailed Verification (no API key needed)

```python
from notaryos import verify_receipt_detailed

result = verify_receipt_detailed(receipt_dict)
if result.valid:
    print("Signature OK:", result.signature_ok)
    print("Structure OK:", result.structure_ok)
else:
    print("Failed:", result.reason)
```

### Public-Only Client (no API key)

```python
from notaryos import NotaryClient

# Create client without API key for public operations only
notary = NotaryClient()

# These all work without authentication:
result = notary.verify(receipt_dict)       # VerificationResult
status = notary.status()                   # ServiceStatus
key_info = notary.public_key()             # Dict with PEM key
lookup = notary.lookup("abc123def456...")   # Receipt lookup by hash

# These will raise AuthenticationError (require API key):
# notary.issue(...)   -> AuthenticationError
# notary.seal(...)    -> AuthenticationError
# notary.me()         -> AuthenticationError
```

## Module Structure

The `notaryos` package wraps the core `notary_sdk` module:

```
sdk/python/
  notary_sdk.py           # Core implementation (all logic lives here)
  notaryos/
    __init__.py           # Re-exports everything from notary_sdk
    integrations/         # Framework-specific adapters
      langchain.py
      crewai.py
      openai_agents.py
      pydantic_ai.py
      anthropic_claude.py
      google_adk.py
      llamaindex.py
      aws_bedrock.py
      smolagents.py
```

Both import styles work:

```python
from notaryos import NotaryClient      # Recommended (package import)
from notary_sdk import NotaryClient    # Also works (direct module import)
```

## API Reference

### `NotaryClient(api_key=None, base_url=None, timeout=30, max_retries=2)`

The `api_key` parameter is optional. When omitted, only public operations
(verify, lookup, status, public_key) are available. Auth-required methods
raise `AuthenticationError` at call time.

| Method | Auth | Description |
|--------|------|-------------|
| `seal(action, agent_id, payload, ...)` | API Key | Seal an action -- create a signed receipt (recommended) |
| `issue(action_type, payload, ...)` | API Key | Issue a signed receipt |
| `verify(receipt)` | Public | Verify a receipt (works with or without API key) |
| `verify_by_id(receipt_id)` | API Key | Verify by receipt ID |
| `status()` | Public | Service health check (works with or without API key) |
| `public_key()` | Public | Get Ed25519 public key (works with or without API key) |
| `me()` | API Key | Authenticated agent info |
| `lookup(receipt_hash)` | Public | Look up receipt by hash |
| `history(options)` | Clerk JWT | Paginated receipt history |
| `provenance(receipt_hash)` | Public | Provenance DAG report |
| `wrap(obj, config=None)` | API Key | Auto-receipt all public methods |
| `unwrap(obj)` | -- | Restore original methods |
| `receipt_stats` | -- | Get queue stats (property) |

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

### Standalone Functions (no client needed)

| Function | Description |
|----------|-------------|
| `verify_receipt(receipt, base_url)` | Public verification -- returns `bool` |
| `verify_receipt_detailed(receipt, base_url)` | Public verification -- returns `VerificationResult` |
| `NotaryClient.compute_hash(payload)` | SHA-256 matching server-side hashing |

### Exported Names

All of the following are available from `from notaryos import ...`:

```python
# Core
NotaryClient
__version__

# Exceptions
NotaryError
AuthenticationError
RateLimitError
ValidationError

# Constants
NotaryErrorCode          # Error code constants (ERR_INVALID_SIGNATURE, etc.)

# Data classes
Receipt
VerificationResult
ServiceStatus

# Auto-receipting
AutoReceiptConfig
CounterfactualClient
receipted                # Class decorator

# Standalone functions
verify_receipt           # Quick bool check (no auth)
verify_receipt_detailed  # Full VerificationResult (no auth)
```

### Error Code Constants

```python
from notaryos import NotaryErrorCode

NotaryErrorCode.ERR_RECEIPT_NOT_FOUND     # 404
NotaryErrorCode.ERR_INVALID_API_KEY       # 401
NotaryErrorCode.ERR_RATE_LIMIT_EXCEEDED   # 429
NotaryErrorCode.ERR_CHAIN_BROKEN          # 400
NotaryErrorCode.ERR_INVALID_SIGNATURE     # 400
NotaryErrorCode.ERR_INVALID_STRUCTURE     # 400
NotaryErrorCode.ERR_PAYLOAD_TOO_LARGE     # 400
# ... 16 total error codes
```

## Counterfactual Receipts

Proof that an agent *chose not to act* -- critical for compliance and audit trails.

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

### OpenAI API

Receipt every `chat.completions.create()` call -- model, token usage, and finish reason:

```python
import openai
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")
client = openai.OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Analyze this contract..."}],
)

receipt = notary.seal("llm.inference", "my-agent", {
    "model": response.model,
    "prompt_tokens": response.usage.prompt_tokens,
    "completion_tokens": response.usage.completion_tokens,
    "finish_reason": response.choices[0].finish_reason,
})

print(f"Receipted: {receipt.verify_url}")
```

Or use `notary.wrap()` to auto-receipt all calls on a client wrapper:

```python
class AuditedLLM:
    def chat(self, messages, model="gpt-4o"):
        return client.chat.completions.create(model=model, messages=messages)

llm = AuditedLLM()
notary.wrap(llm)          # every llm.chat() now issues a receipt automatically
result = llm.chat([...])
```

### OpenAI Agents SDK

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
    receipt = notary.seal("action", "agent-id", payload)
except AuthenticationError:
    # Invalid or missing API key
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
    api_key="notary_live_xxx",           # Optional (None for public-only mode)
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

BUSL-1.1
