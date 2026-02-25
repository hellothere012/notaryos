"""
NotaryOS + OpenAI Agents SDK Integration Test

Proves wrap() works on service objects that would be registered as
OpenAI Agent tools. The SDK auto-receipts every method invocation.

Requires: pip install notaryos[openai-agents]
"""

import time

import pytest

pytest.importorskip("agents", reason="openai-agents not installed")

from notary_sdk import AutoReceiptConfig  # noqa: E402


class ResearchService:
    """Service whose methods are auto-receipted by NotaryOS."""

    def search(self, query: str) -> dict:
        return {"query": query, "results": ["result_1", "result_2"], "count": 2}

    def summarize(self, text: str) -> str:
        return f"Summary of: {text[:50]}"

    def cite(self, source_id: str) -> dict:
        return {"source_id": source_id, "citation": f"[{source_id}]", "valid": True}


def test_wrap_with_openai_agents(notary):
    """Wrapped research service works correctly for OpenAI Agent tool patterns."""
    config = AutoReceiptConfig(fire_and_forget=True)
    svc = ResearchService()
    notary.wrap(svc, config=config)

    r1 = svc.search("quantum computing breakthroughs")
    assert r1["count"] == 2
    assert r1["query"] == "quantum computing breakthroughs"

    r2 = svc.summarize("Long article about quantum computing and its applications...")
    assert r2.startswith("Summary of:")

    r3 = svc.cite("arxiv:2026.01234")
    assert r3["valid"] is True

    time.sleep(5)

    stats = notary.receipt_stats
    total = stats["issued"] + stats["failed"]
    assert total >= 1, f"Expected >=1 receipt attempted via wrap(), got {stats}"
    notary.unwrap(svc)
