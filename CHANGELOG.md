# Changelog

All notable changes to the NotaryOS open-source components will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-03-15

### Changed

- **SDK v2.2.0** — Both Python and TypeScript SDKs updated
  - Zero-arg `NotaryClient()` constructor (uses free demo key, 10 req/min, no signup needed)
  - `seal()` is now the primary method (2 args: `action_type`, `payload`)
  - `issue()` remains as an alias
  - Receipt chaining via `previous_receipt_hash` parameter
  - Input validation for `action_type` (TypeScript)

### Fixed

- All documentation updated to use correct 2-arg `seal()` signature
- Removed references to non-existent features (`wrap()`, `@receipted`, `AutoReceiptConfig`, `OfflineVerifier`, framework integrations)
- SDK READMEs now accurately reflect the published API

### Added

- **ClawHub listing** — NotaryOS published as an OpenClaw skill (`clawhub install notaryos`)
- `verify_receipt()` standalone function (Python) — no client needed
- `verifyReceipt()` standalone function (TypeScript) — no client needed
- `computeHash()` utility (TypeScript)

## [1.0.0] - 2026-02-12

### Added

- **Python SDK** (`notaryos` on PyPI)
  - `NotaryClient` with `issue()`, `verify()`, `status()`, `public_key()` methods
  - CLI tool: `notaryos verify`, `notaryos status`, `notaryos issue`
  - Zero runtime dependencies (Python 3.8+ stdlib only)
  - Context manager support for connection lifecycle
  - Exponential backoff retry logic

- **TypeScript SDK** (`notaryos` on npm)
  - `NotaryClient` with `issue()`, `verify()`, `verifyById()`, `status()` methods
  - `verifyReceipt()` standalone verification function
  - Zero runtime dependencies (native `fetch` + `crypto.subtle`)
  - Typed error hierarchy: `NotaryError`, `AuthenticationError`, `RateLimitError`, `ValidationError`
  - Node 18+, Deno, Bun, and modern browser support

- **Go SDK** (coming soon)
  - `Client` with `Issue()`, `Verify()`, `Status()`, `SampleReceipt()` methods
  - Zero external dependencies (Go 1.21+ stdlib only)
  - Context-aware API with configurable timeouts

- **React Verification UI**
  - Public receipt verification interface
  - Receipt paste-and-verify flow
  - Chain visualization
  - Landing page with product information

- **Documentation**
  - Technical Reference Manual (v1.5.21)
  - User Manual
  - Quick Start Guide
  - SDK Integration Examples
  - Independent Chain Verification Guide
  - Product Brochure

- **Configuration**
  - Enterprise thresholds (performance, security, grading)
  - Environment variable reference (`.env.example`)

- **Code Examples**
  - Basic verification (`examples/basic_verify.py`)
  - Chain verification (`examples/chain_verification.py`)
  - Audit trail integration (`examples/audit_trail.py`)
  - Third-party audit (`examples/third_party_audit.py`)
