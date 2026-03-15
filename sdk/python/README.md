# NotaryOS Python SDK

Cryptographic receipts for AI agent actions. Seal, verify, and audit agent behavior with Ed25519 signatures.

**Zero external dependencies.** Uses only Python standard library (`urllib`, `hashlib`, `json`). Python 3.8+.

## Install

```bash
pip install notaryos
```

## Quick Start

### Seal an Action

```python
from notaryos import NotaryClient

notary = NotaryClient()  # uses built-in demo key (10 req/min)
receipt = notary.seal("data_processing", {"key": "value"})
print(receipt.receipt_hash)   # "a1b2c3..."
print(receipt.verify_url)     # https://api.agenttownsquare.com/v1/notary/r/a1b2c3...
```

### Verify a Receipt (no API key needed)

```python
from notaryos import verify_receipt

is_valid = verify_receipt(receipt_dict)  # True or False
```

### Look Up a Receipt by Hash

```python
notary = NotaryClient()
data = notary.lookup("a1b2c3def456...")
print(data)  # full receipt dict from server
```

### Production API Key

```python
notary = NotaryClient(api_key="notary_live_xxx")
receipt = notary.seal("trade.execute", {"symbol": "AAPL", "qty": 100})
```

## API Reference

### `NotaryClient(api_key=None, base_url=None, timeout=30, max_retries=2)`

When `api_key` is omitted, the client uses a built-in demo key limited to 10 requests per minute. Public operations (verify, lookup, status, public_key) work with or without a key. Auth-required methods raise `AuthenticationError` if no key is configured.

| Method | Auth | Returns | Description |
|--------|------|---------|-------------|
| `seal(action_type, payload, previous_receipt_hash=None, metadata=None)` | API Key | `Receipt` | Seal an action with a signed receipt (preferred) |
| `issue(action_type, payload, previous_receipt_hash=None, metadata=None)` | API Key | `Receipt` | Issue a signed receipt (same as seal) |
| `verify(receipt_dict)` | Public | `VerificationResult` | Verify a receipt's signature and integrity |
| `lookup(receipt_hash)` | Public | `dict` | Look up a receipt by its hash |
| `status()` | Public | `ServiceStatus` | Service health check |
| `public_key()` | Public | `dict` | Get the Ed25519 public key (PEM + JWKS) |
| `me()` | API Key | `dict` | Authenticated agent/user info |
| `commit_counterfactual(action_not_taken, capability_proof, opportunity_context, decision_reason)` | API Key | `dict` | Commit a counterfactual receipt (proof of non-action) |
| `reveal_counterfactual(receipt_hash, decision_reason)` | API Key | `dict` | Reveal a previously committed counterfactual |

### Standalone Functions

| Function | Description |
|----------|-------------|
| `verify_receipt(receipt_dict)` | Quick verification -- returns `bool`. No auth needed. |

### Data Classes

**`Receipt`** -- returned by `seal()` and `issue()`:

```python
receipt.receipt_hash      # str - unique hash identifier
receipt.signature         # str - Ed25519 signature
receipt.chain_sequence    # int - position in the chain
receipt.verify_url        # str - public verification URL
receipt.to_dict()         # dict - full receipt as dictionary
```

**`VerificationResult`** -- returned by `verify()`:

```python
result.valid          # bool - overall validity
result.signature_ok   # bool - Ed25519 signature check passed
result.structure_ok   # bool - receipt structure is well-formed
result.chain_ok       # bool - chain integrity verified
result.reason         # str - human-readable explanation
result.details        # dict - additional verification metadata
```

**`ServiceStatus`** -- returned by `status()`:

```python
svc.status          # str - "operational", "degraded", etc.
svc.signature_type  # str - "ed25519"
```

### Exports

All of the following are importable from `notaryos`:

```python
from notaryos import (
    NotaryClient,
    NotaryError,
    AuthenticationError,
    RateLimitError,
    ValidationError,
    Receipt,
    VerificationResult,
    ServiceStatus,
    verify_receipt,
    __version__,        # "2.2.0"
)
```

## Counterfactual Receipts

Proof that an agent *chose not to act* -- critical for compliance and audit trails.

### Commit-Reveal Pattern

The commit phase seals the decision without exposing the reason. The reveal phase discloses the plaintext reason and verifies it matches the original commitment hash.

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")

# Phase 1: Commit (reason is hashed, not stored in plaintext)
result = notary.commit_counterfactual(
    action_not_taken="execute_trade",
    capability_proof={"scope": "trade:execute", "granted": True},
    opportunity_context={"symbol": "AAPL", "price": 231.50},
    decision_reason="Market volatility exceeded risk threshold",
)
receipt_hash = result["receipt_hash"]

# Phase 2: Reveal (proves the reason matches the original hash)
revealed = notary.reveal_counterfactual(
    receipt_hash=receipt_hash,
    decision_reason="Market volatility exceeded risk threshold",
)
```

## Error Handling

```python
from notaryos import (
    NotaryClient,
    NotaryError,
    AuthenticationError,
    RateLimitError,
    ValidationError,
)

notary = NotaryClient(api_key="notary_live_xxx")

try:
    receipt = notary.seal("action_type", {"key": "value"})
except AuthenticationError:
    # Invalid or missing API key
    print("Check your API key")
except RateLimitError as e:
    # Too many requests -- back off and retry
    print(f"Rate limited: {e}")
except ValidationError:
    # Malformed payload or invalid action_type
    print("Check your input data")
except NotaryError as e:
    # Catch-all for any other SDK error
    print(f"NotaryOS error: {e}")
```

## Configuration

```python
notary = NotaryClient(
    api_key="notary_live_xxx",                          # omit for demo mode (10 req/min)
    base_url="https://api.agenttownsquare.com",         # default
    timeout=30,                                         # request timeout in seconds
    max_retries=2,                                      # automatic retries on failure
)
```

### Environment Variable

You can also set your API key via environment variable instead of passing it directly:

```bash
export NOTARYOS_API_KEY="notary_live_xxx"
```

```python
notary = NotaryClient()  # picks up NOTARYOS_API_KEY automatically
```

## CLI

The SDK includes a command-line interface:

```bash
notaryos status                           # Check service health
notaryos issue notary_live_xxx my_action  # Issue a receipt
notaryos verify '{"receipt_id": "..."}'   # Verify a receipt
notaryos lookup abc123def456              # Look up receipt by hash
```

## License

BUSL-1.1
