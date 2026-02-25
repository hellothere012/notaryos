"""
NotaryOS + LangChain Integration Test

Proves wrap() works on service objects used within LangChain agent workflows.
The wrapped object's methods auto-issue receipts without breaking return values.

Requires: pip install notaryos[langchain]
"""

import time

import pytest

pytest.importorskip("langchain_core", reason="langchain-core not installed")

from langchain_core.tools import tool  # noqa: E402

from notary_sdk import AutoReceiptConfig  # noqa: E402


class InventoryService:
    """Business logic that gets auto-receipted via wrap()."""

    def check_stock(self, item: str) -> dict:
        return {"item": item, "in_stock": True, "qty": 42}

    def reserve(self, item: str, qty: int) -> dict:
        return {"reserved": True, "item": item, "qty": qty}


def test_wrap_with_langchain(notary):
    """Service methods wrapped by NotaryOS work correctly inside LangChain tools."""
    config = AutoReceiptConfig(fire_and_forget=True)
    svc = InventoryService()
    notary.wrap(svc, config=config)

    # LangChain tool calls the wrapped service
    @tool
    def check_inventory(item: str) -> str:
        """Check item stock levels."""
        result = svc.check_stock(item)
        return f"{result['item']}: {result['qty']} in stock"

    # Direct calls — return values must be unchanged
    r1 = svc.check_stock("widget")
    assert r1["in_stock"] is True
    assert r1["item"] == "widget"

    r2 = svc.reserve("widget", 3)
    assert r2["reserved"] is True

    # Via LangChain tool wrapper — wrapped service still works inside
    tool_result = check_inventory.invoke("laptop")
    assert "laptop" in tool_result
    assert "42 in stock" in tool_result

    # Allow background queue to drain
    time.sleep(5)

    stats = notary.receipt_stats
    total = stats["issued"] + stats["failed"]
    assert total >= 1, f"Expected >=1 receipt attempted via wrap(), got {stats}"
    notary.unwrap(svc)
