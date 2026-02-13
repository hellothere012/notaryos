# NotaryOS SDK for Go

Cryptographic receipts for AI agent actions. Issue, verify, and audit agent behavior with Ed25519 signatures.

**Zero external dependencies.** Uses only `net/http` from the standard library. Go 1.21+.

## Install

```bash
go get github.com/agenttownsquare/notaryos-go/notary
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

    "github.com/agenttownsquare/notaryos-go/notary"
)

func main() {
    // Create client
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

    // Check service status
    status, err := client.Status()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Service: %s\n", status.Status)
}
```

### Verify Without API Key

```go
isValid, err := notary.VerifyReceipt(receiptMap, "")
fmt.Println(isValid) // true
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

### `notary.VerifyReceipt(receipt, baseURL) (bool, error)`

Public verification without API key.

## Configuration

```go
client, err := notary.NewClient("notary_live_xxx", &notary.Config{
    BaseURL:    "https://api.agenttownsquare.com", // default
    Timeout:    30 * time.Second,                   // default
    MaxRetries: 2,                                  // default
})
```

## Error Handling

```go
receipt, err := client.Issue("action", payload)
if err != nil {
    var notaryErr *notary.NotaryError
    if errors.As(err, &notaryErr) {
        fmt.Printf("Code: %s, Status: %d\n", notaryErr.Code, notaryErr.Status)
    }
}
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
