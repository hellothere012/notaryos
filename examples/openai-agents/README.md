# NotaryOS + OpenAI Agents SDK

[![NotaryOS Verified](https://img.shields.io/badge/NotaryOS-Verified-green?logo=shield)](https://notaryos.org)
[![Tested in CI](https://img.shields.io/github/actions/workflow/status/hellothere012/notaryos/integration-tests.yml?label=CI)](https://github.com/hellothere012/notaryos/actions)

OpenAI handles the intelligence. You handle the audit.

## Quick Start

```bash
pip install notaryos openai-agents
export NOTARY_API_KEY="notary_live_YOUR_KEY"
python main.py
```

## How It Works

Wrap your tool backend classes with NotaryOS. When the OpenAI Agent invokes your tools, every call gets a cryptographic receipt with Ed25519 signatures.

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")
notary.wrap(research_service)  # every search/summarize is receipted
```
