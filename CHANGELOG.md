# Changelog

All notable changes to the NotaryOS open-source components will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- **Go SDK** (`github.com/agenttownsquare/notaryos-go`)
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

- **Database Migrations**
  - Production schema for receipts, chains, and keys
  - Grounding migration for provenance DAG and counterfactual receipts

- **Configuration**
  - Enterprise thresholds (billing tiers, abuse detection, SLOs)
  - Environment variable reference (`.env.example`)

- **Code Examples**
  - Basic verification (`examples/basic_verify.py`)
  - Chain verification (`examples/chain_verification.py`)
  - Audit trail integration (`examples/audit_trail.py`)
  - Third-party audit (`examples/third_party_audit.py`)
