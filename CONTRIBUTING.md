# Contributing to NotaryOS

Thank you for your interest in contributing to NotaryOS! This document provides guidelines for contributing to the open-source components of the project.

## What's Open Source

The following components accept contributions:

- **SDKs** (`sdk/`) — Python, TypeScript, and Go client libraries
- **Verification UI** (`ui/`) — React-based receipt verification interface
- **Documentation** (`docs/`) — Technical manual, user guides, examples
- **Examples** (`examples/`) — Code examples and integration patterns
- **Configuration** (`config/`) — Enterprise threshold configuration

The NotaryOS backend engine (signing, grounding, abuse detection) is proprietary and not part of this repository.

## Getting Started

### Prerequisites

- Node.js 18+ (for UI and TypeScript SDK)
- Python 3.8+ (for Python SDK and examples)
- Go 1.21+ (for Go SDK)


### Setup

```bash
# Clone the repository
git clone https://github.com/hellothere012/notaryos.git
cd notaryos

# UI development
cd ui && npm install && npm start

# Python SDK development
cd sdk/python && pip install -e ".[dev]"

# TypeScript SDK development
cd sdk/typescript && npm install && npm run build

# Go SDK development
cd sdk/go && go test ./...
```

## How to Contribute

### Reporting Bugs

1. Check existing [issues](https://github.com/hellothere012/notaryos/issues) first
2. Use the bug report template
3. Include: SDK version, language/runtime version, steps to reproduce, expected vs actual behavior

### Suggesting Features

1. Open an issue with the feature request template
2. Describe the use case and expected behavior
3. If proposing an API change, include example code

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Update documentation if you change behavior
- Add tests for new features
- Follow existing code style

## Code Style

### Python
- Follow PEP 8
- Use type hints
- Zero runtime dependencies (stdlib only)

### TypeScript
- Strict mode enabled
- Use native `fetch()` and `crypto.subtle` — no external dependencies
- Target ES2020+

### Go
- Follow standard Go conventions (`gofmt`, `go vet`)
- Zero external dependencies (stdlib only)
- Handle errors explicitly

## Testing

### SDKs

All SDKs should maintain tests that verify:
- Receipt verification (valid and invalid signatures)
- Chain integrity checking
- Hash computation consistency
- Error handling (network failures, malformed receipts)
- Type safety

### UI

- Component tests for verification flow
- Integration tests against the public API

## Documentation

When updating documentation:
- Keep code examples working and tested
- Update all three SDK examples when changing API behavior
- Reference the correct API endpoints

## Security

If you discover a security vulnerability, please **do not** open a public issue. Instead, email security@notaryos.org with details.

## License

By contributing, you agree that your contributions will be licensed under the BUSL-1.1 license.

## Questions?

- Open a [discussion](https://github.com/hellothere012/notaryos/discussions)
- Check the [documentation](docs/)
- Visit [notaryos.org](https://notaryos.org)
