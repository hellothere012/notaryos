# Notary — Receipt Verification for AI Agent Systems

**Verify AI agent receipts—cryptographically.** Notary is the trust layer for agent-to-agent systems. Upload a receipt (JSON) and verify signatures, chain integrity, and timestamps in seconds.

![Notary Verifier Screenshot](docs/images/verifier-screenshot.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)

---

## Why Notary

Most agent logs are easy to fake. **Receipts aren't.**

Agent systems increasingly make decisions and trigger actions across tools, services, and teams. Notary receipts add cryptographic proof—so "this happened" can be verified, not just asserted.

- **Instant verification** — Validate signatures, chain continuity, and timestamps in one place
- **Explainable failures** — Clear, actionable errors—no guessing what broke
- **Portable proof** — Receipts are JSON and can be verified offline or in CI

---

## Demo (Hosted)

Try the hosted demo without any setup:

**[Open Notary Verifier →](https://notaryos.org)**

### Quick Start with Sample Receipt

1. Go to the [Notary Verifier](https://notaryos.org/verify)
2. Click **"Load Sample"** to load a test receipt
3. Click **"Verify Receipt"** (or press `Cmd+Enter`)
4. See instant verification results with chain visualization

No signup required for the demo. Works with sample receipts.

---

## Quickstart (Local / Docker)

### Requirements

- Node.js 18+ and npm
- Docker & Docker Compose (for backend)
- Python 3.11+ (for backend development)

### Run with Docker

```bash
# Clone the repository
git clone https://github.com/hellothere012/notaryos.git
cd notary

# Start all services
docker-compose up -d

# Open the UI
open http://localhost:3000
```

### Run Frontend Only (Development)

```bash
cd ui/notary

# Install dependencies
npm install

# Start development server
npm start

# Open http://localhost:3000
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | NotaryOS API URL | `https://api.agenttownsquare.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth key | Required |
| `NOTARY_API_KEY` | NotaryOS API key | `notary_live_...` |

---

## Receipt Format / Spec

Notary verifies JSON receipts following this format:

```json
{
  "receipt_hash": "sha256:a1b2c3d4e5f6789012345678901234567890abcdef",
  "original_hash": "sha256:0123456789abcdef0123456789abcdef01234567",
  "signature": "base64:SGVsbG8gV29ybGQhIFRoaXMgaXMgYSBzYW1wbGUgc2lnbmF0dXJl",
  "signed_at": "2026-01-31T10:30:00Z",
  "signer_id": "notary-v1-ed25519",
  "protocol_version": "1.0",
  "chain": {
    "previous_hash": "sha256:00000000000000000000000000000000genesis",
    "sequence_number": 42,
    "chain_signature": "base64:Y2hhaW4tc2lnbmF0dXJlLWV4YW1wbGU="
  }
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `receipt_hash` | string | Hash of the receipt content (sha256:...) |
| `signature` | string | Cryptographic signature (base64:...) |
| `signed_at` | ISO 8601 | When the receipt was signed |
| `signer_id` | string | Identifier of the signing key |
| `protocol_version` | string | Receipt format version |

### Optional Chain Fields

| Field | Type | Description |
|-------|------|-------------|
| `chain.previous_hash` | string | Hash of the previous receipt in chain |
| `chain.sequence_number` | number | Position in the chain (1-indexed) |
| `chain.chain_signature` | string | Signature covering the chain link |

### Canonicalization Rules

1. Fields are sorted alphabetically before signing
2. Whitespace is normalized (no trailing whitespace, LF line endings)
3. Numbers are represented without trailing zeros
4. Null values are omitted from signed content

For the complete specification, see [RECEIPT_SPEC.md](docs/RECEIPT_SPEC.md).

---

## Verification API

### Verify a Receipt

```bash
curl -X POST https://api.agenttownsquare.com/v1/notary/verify \
  -H "Content-Type: application/json" \
  -d '{
    "receipt_hash": "sha256:a1b2c3d4...",
    "signature": "base64:SGVsbG8...",
    "signed_at": "2026-01-31T10:30:00Z",
    "signer_id": "notary-v1-ed25519",
    "protocol_version": "1.0"
  }'
```

### Response (Valid)

```json
{
  "valid": true,
  "message": "Receipt verified successfully",
  "signature_valid": true,
  "chain_valid": true,
  "timestamp_valid": true,
  "details": {
    "signer_id": "notary-v1-ed25519",
    "signed_at": "2026-01-31T10:30:00Z",
    "algorithm": "ed25519",
    "chain_position": 42,
    "receipt_hash": "sha256:a1b2c3d4..."
  }
}
```

### Response (Invalid)

```json
{
  "valid": false,
  "message": "Signature verification failed",
  "signature_valid": false,
  "chain_valid": true,
  "timestamp_valid": true,
  "errors": [
    "Signature does not match receipt content"
  ]
}
```

### Get Sample Receipt

```bash
curl https://api.agenttownsquare.com/v1/notary/sample-receipt
```

### API Documentation

Full API documentation available at [/api/docs](https://api.agenttownsquare.com/api/docs) (OpenAPI/Swagger).

---

## Security Model

### What Verification Proves

- **Integrity** — The receipt content wasn't modified after signing
- **Authenticity** — Signed by the key corresponding to the signer_id
- **Chain Integrity** — Cryptographic linkage is consistent (if chain present)
- **Timestamp Validity** — Timestamp is syntactically valid and within constraints

### What Verification Does NOT Prove

- **Truth of the event** — A valid signature doesn't guarantee the event occurred
- **Authorization** — Doesn't prove the signer was authorized to perform the action
- **Completeness** — Can't prove all events were recorded (only chain continuity)

### Supported Algorithms

| Algorithm | Key Size | Use Case |
|-----------|----------|----------|
| Ed25519 | 256-bit | Recommended for third-party verification |
| HMAC-SHA256 | 256-bit | Internal/trusted environment verification |

### Key Rotation

Keys can be rotated without invalidating old receipts:
1. Generate new key with new `key_id`
2. Update signer configuration via Admin UI
3. Old receipts remain verifiable with old public key
4. New receipts use new key

For detailed security practices, see [SECURITY.md](SECURITY.md).

---

## Project Structure

```
ui/notary/
├── src/
│   ├── components/
│   │   ├── landing/           # Marketing landing page
│   │   ├── verification/      # Verifier UI components
│   │   ├── history/           # Verification history
│   │   ├── apikeys/           # API key management
│   │   ├── admin/             # Admin dashboard
│   │   ├── auth/              # Login/signup
│   │   └── layout/            # Header, sidebar, footer
│   ├── hooks/
│   │   └── useNotary.ts       # Verification hook
│   ├── config/
│   │   └── api.ts             # API configuration
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── contexts/
│       └── AuthContext.tsx    # Authentication state
├── public/
└── package.json

# Backend API endpoints are proprietary
# See docs/TECHNICAL_MANUAL.md for the API specification
```

---

## Contributing

We welcome contributions! Here's how to get started:

### Development Setup

```bash
# Clone and install
git clone https://github.com/hellothere012/notaryos.git
cd notary/ui/notary
npm install

# Start dev server with hot reload
npm start

# Run tests
npm test

# Run linter
npm run lint
```

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Tailwind CSS for styling
- Framer Motion for animations

### Pull Request Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Run `npm run lint && npm test`
5. Commit with conventional commits (`feat:`, `fix:`, `docs:`)
6. Push and open a Pull Request

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- VerifyPanel.test.tsx
```

---

## Roadmap

### Current (v1.0)
- [x] Receipt verification UI
- [x] Chain visualization
- [x] Verification history
- [x] API key management
- [x] Admin dashboard
- [x] Ed25519 + HMAC support

### Planned (v1.1)
- [ ] Batch verification API
- [ ] Webhook notifications
- [ ] Receipt generation SDK
- [ ] CLI tool for CI integration
- [ ] Multiple chain support

### Future
- [ ] Third-party key registry
- [ ] Merkle tree proofs
- [ ] Hardware security module (HSM) support
- [ ] Decentralized verification nodes

---

## License

MIT License - see [LICENSE](LICENSE) for details.

Open source verification core. Hosted demo provided as-is.

---

## Acknowledgements

Built by [Agent Town Square](https://github.com/hellothere012/notaryos).

Special thanks to the cryptography community for Ed25519 and the agent ecosystem for inspiring this project.

---

**"Proof > Promises"**

[Try the Demo](https://notaryos.org) · [View on GitHub](https://github.com/hellothere012/notaryos) · [Read the Docs](https://notaryos.org/docs)
