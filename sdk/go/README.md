# NotaryOS SDK for Go

Cryptographic receipts for AI agent actions. Issue, verify, and audit agent behavior with Ed25519 signatures.

**Zero external dependencies.** Uses only `net/http`, `crypto/sha256`, `crypto/ed25519` from the standard library. Go 1.21+.

## Install

```bash
go get github.com/hellothere012/notaryos-go/notary
```

## Quick Start

### Issue a Receipt (3 lines)

```go
client, _ := notary.NewClient("notary_live_xxx", nil)
receipt, _ := client.Issue("data_processing", map[string]any{"key": "value"})
fmt.Println(receipt.VerifyURL)
```

### Full Example

```go
package main

import (
    "fmt"
    "log"

    "github.com/hellothere012/notaryos-go/notary"
)

func main() {
    client, err := notary.NewClient("notary_live_xxx", nil)
    if err != nil {
        log.Fatal(err)
    }

    // Issue a receipt
    receipt, err := client.Issue("financial.transfer", map[string]any{
        "from":     "billing-agent",
        "to":       "ledger-agent",
        "amount":   150.00,
        "currency": "USD",
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Receipt: %s\n", receipt.ReceiptID)
    fmt.Printf("Verify:  %s\n", receipt.VerifyURL)

    // Verify it
    result, err := client.Verify(receipt)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Valid: %v\n", result.Valid)
}
```

## API Reference

### `notary.NewClient(apiKey string, config *Config) (*Client, error)`

| Method | Auth | Description |
|--------|------|-------------|
| `Issue(actionType, payload, opts...)` | API Key | Issue a signed receipt |
| `Verify(receipt)` | API Key | Verify a receipt |
| `VerifyByID(receiptID)` | API Key | Verify by receipt ID |
| `Status()` | API Key | Service health check |
| `PublicKey()` | API Key | Get Ed25519 public key |
| `Me()` | API Key | Authenticated agent info |
| `Lookup(receiptHash)` | Public | Look up receipt by hash |
| `History(opts)` | Clerk JWT | Paginated receipt history |
| `Provenance(receiptHash)` | Public | Provenance DAG report |
| `Counterfactual()` | — | Access counterfactual sub-client |

### `client.Counterfactual().*`

| Method | Auth | Description |
|--------|------|-------------|
| `Issue(opts)` | API Key | Issue v1 counterfactual |
| `Get(receiptHash)` | Public | Verify counterfactual |
| `ListByAgent(agentID, limit, offset)` | Public | List agent's counterfactuals |
| `Commit(opts)` | API Key | v2 commit phase |
| `Reveal(hash, plaintext)` | API Key | v2 reveal phase |
| `CommitStatus(hash)` | Public | Check commit-reveal status |
| `Corroborate(hash, signals)` | API Key | Counter-sign |
| `Certificate(hash, format)` | Public | Compliance certificate |
| `VerifyChain(agentID)` | Public | Chain continuity |

### Standalone Functions

| Function | Description |
|----------|-------------|
| `VerifyReceipt(receipt, baseURL)` | Public verification (returns bool) |
| `ComputeHash(payload)` | SHA-256 matching server-side hashing |

### Error Code Constants

```go
notary.ErrReceiptNotFound     // "ERR_RECEIPT_NOT_FOUND"
notary.ErrInvalidAPIKey       // "ERR_INVALID_API_KEY"
notary.ErrRateLimitExceeded   // "ERR_RATE_LIMIT_EXCEEDED"
notary.ErrChainBroken         // "ERR_CHAIN_BROKEN"
// ... 16 total error codes
```

## Counterfactual Receipts

```go
cf := client.Counterfactual()

// v1: Direct issuance
stamp, err := cf.Issue(notary.CounterfactualIssueOptions{
    ActionNotTaken:    "delete_user_data",
    CapabilityProof:   map[string]any{"scope": "data:delete"},
    OpportunityContext: map[string]any{"user_id": "u_123"},
    DecisionReason:    "GDPR retention period not expired",
})

// v2: Commit-reveal
commit, err := cf.Commit(notary.CounterfactualCommitOptions{...})
reveal, err := cf.Reveal(receiptHash, "original plaintext reason")

// Corroboration
result, err := cf.Corroborate(receiptHash, []string{"log_entry", "witness"})
```

## Auto-Receipting

```go
// Create a background receipt queue
queue := notary.NewReceiptQueue(client, 1000)
defer queue.Close()

// Record actions (fire-and-forget via goroutine)
notary.RecordAction(client, queue, "MyAgent", "processData",
    map[string]any{"input": data},
    result, err, durationMs, nil)

// Check queue stats
stats := queue.Stats()
fmt.Println(stats) // {"issued": 42, "failed": 0, "dropped": 0, "pending": 1}
```

## Offline Verification

```go
verifier, err := notary.NewOfflineVerifier("")
if err != nil {
    log.Fatal(err)
}

result := verifier.Verify(receiptMap)
fmt.Println(result.Valid)  // true — no API call needed
fmt.Println(result.KeyID)  // key ID used for verification
```

## Error Handling

```go
receipt, err := client.Issue("action", payload)
if err != nil {
    var notaryErr *notary.NotaryError
    if errors.As(err, &notaryErr) {
        switch notaryErr.Code {
        case notary.ErrRateLimitExceeded:
            // Wait and retry
        case notary.ErrInvalidAPIKey:
            // Check API key
        default:
            fmt.Printf("Code: %s, Status: %d\n", notaryErr.Code, notaryErr.Status)
        }
    }
}
```

## Configuration

```go
client, err := notary.NewClient("notary_live_xxx", &notary.Config{
    BaseURL:    "https://api.agenttownsquare.com", // default
    Timeout:    30 * time.Second,                   // default
    MaxRetries: 2,                                  // default
})
```

## License

MIT
