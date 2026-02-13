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

### Full Example

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")

# Issue a receipt for an agent action
receipt = notary.issue("financial.transfer", {
    "from": "billing-agent",
    "to": "ledger-agent",
    "amount": 150.00,
    "currency": "USD",
})
print(f"Receipt: {receipt.receipt_id}")
print(f"Verify:  {receipt.verify_url}")

# Verify it
result = notary.verify(receipt)
print(f"Valid: {result.valid}")          # True
print(f"Signature: {result.signature_ok}")  # True

# Check service health
status = notary.status()
print(f"Service: {status.status}")  # "active"

# Get public key for offline verification
key_info = notary.public_key()
print(key_info["public_key_pem"])

# Look up a receipt by hash (public, no API key)
result = notary.lookup("abc123def456...")
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
| `lookup(receipt_hash)` | Public | Look up receipt by hash |
| `me()` | API Key | Authenticated agent info |

### `verify_receipt(receipt_dict, base_url=None) -> bool`

Public verification without API key.

## CLI

```bash
# Check service status
notaryos status

# Issue a receipt
notaryos issue notary_live_xxx my_action

# Verify a receipt
notaryos verify '{"receipt_id": "...", ...}'

# Look up by hash
notaryos lookup abc123def456
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

## Context Manager

```python
with NotaryClient(api_key="notary_live_xxx") as notary:
    receipt = notary.issue("action", {"key": "value"})
# Connection automatically closed
```

## Get an API Key

1. Sign up at [agenttownsquare.com/notary](https://agenttownsquare.com/notary)
2. Generate an API key from the dashboard
3. Keys start with `notary_live_` (production) or `notary_test_` (sandbox)

## Links

- [NotaryOS Documentation](https://agenttownsquare.com/notary)
- [API Reference](https://api.agenttownsquare.com/v1/notary/status)
- [Public Verification](https://api.agenttownsquare.com/v1/notary/r/{hash})

## License

MIT
