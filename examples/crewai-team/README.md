# NotaryOS + CrewAI

[![NotaryOS Verified](https://img.shields.io/badge/NotaryOS-Verified-green?logo=shield)](https://notaryos.org)
[![Tested in CI](https://img.shields.io/github/actions/workflow/status/hellothere012/notaryos/integration-tests.yml?label=CI)](https://github.com/hellothere012/notaryos/actions)

When agents collaborate, who's responsible? NotaryOS receipts every action.

## Quick Start

```bash
pip install notaryos crewai
export NOTARY_API_KEY="notary_live_YOUR_KEY"
python main.py
```

## How It Works

In multi-agent workflows, accountability matters. `wrap()` receipts every method call on your service layer, creating a tamper-evident audit trail across all agents in your crew.

```python
from notaryos import NotaryClient

notary = NotaryClient(api_key="notary_live_xxx")
notary.wrap(compliance_checker)  # every check is receipted
notary.wrap(data_processor)      # every processing step too
```
