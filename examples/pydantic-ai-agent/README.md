# NotaryOS + PydanticAI

[![NotaryOS Verified](https://img.shields.io/badge/NotaryOS-Verified-green?logo=shield)](https://notaryos.org)
[![Tested in CI](https://img.shields.io/github/actions/workflow/status/hellothere012/notaryos/integration-tests.yml?label=CI)](https://github.com/hellothere012/notaryos/actions)

Type-safe agents, type-safe proof.

## Quick Start

```bash
pip install notaryos pydantic-ai
export NOTARY_API_KEY="notary_live_YOUR_KEY"
python main.py
```

## How It Works

PydanticAI's dependency injection pattern is perfect for NotaryOS. Wrap your dependency class and every method call gets a receipt — with full type hints and IDE autocomplete.

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")
notary.wrap(data_service)  # type-safe receipts for every query
```
