# NotaryOS + LangChain

[![NotaryOS Verified](https://img.shields.io/badge/NotaryOS-Verified-green?logo=shield)](https://notaryos.org)
[![Tested in CI](https://img.shields.io/github/actions/workflow/status/hellothere012/notaryos/integration-tests.yml?label=CI)](https://github.com/hellothere012/notaryos/actions)

Cryptographic receipts for every LangChain agent action. 3 lines of code.

## Quick Start

```bash
pip install notaryos langchain langchain-core
export NOTARY_API_KEY="notary_live_YOUR_KEY"
python main.py
```

## How It Works

NotaryOS `wrap()` auto-receipts every public method on your service objects. When a LangChain agent calls your wrapped tool, each invocation gets a signed, verifiable receipt with Ed25519 signatures and hash-chain linking.

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")
notary.wrap(my_service)   # 1 line to add receipts
my_service.process(data)  # auto-receipted!
```

## What Gets Receipted

Every call to a public method on the wrapped object captures:
- Method name and arguments
- Return value summary
- Execution duration
- Success/error status
- Chain link to previous receipt (tamper-evident)
