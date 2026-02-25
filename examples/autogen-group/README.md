# NotaryOS + AutoGen

[![NotaryOS Verified](https://img.shields.io/badge/NotaryOS-Verified-green?logo=shield)](https://notaryos.org)
[![Tested in CI](https://img.shields.io/github/actions/workflow/status/hellothere012/notaryos/integration-tests.yml?label=CI)](https://github.com/hellothere012/notaryos/actions)

Microsoft's agent framework. Your proof layer.

## Quick Start

```bash
pip install notaryos autogen-agentchat
export NOTARY_API_KEY="notary_live_YOUR_KEY"
python main.py
```

## How It Works

AutoGen's multi-agent conversations need accountability. Wrap your analytics or business logic objects, and every method call in the agent conversation gets a verifiable receipt.

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")
notary.wrap(analytics_engine)  # every analysis is receipted
```
