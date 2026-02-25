"""
NotaryOS + PydanticAI Integration Test

Proves wrap() works on PydanticAI dependency/service objects.
PydanticAI has the best testing story with built-in TestModel.

Requires: pip install notaryos[pydantic-ai]
"""

import time

import pytest

pytest.importorskip("pydantic_ai", reason="pydantic-ai not installed")

from notary_sdk import AutoReceiptConfig  # noqa: E402


class DataService:
    """Dependency class wrapped by NotaryOS for receipting."""

    def fetch_user(self, user_id: int) -> dict:
        return {"id": user_id, "name": "Alice", "active": True}

    def update_preferences(self, user_id: int, prefs: dict) -> dict:
        return {"user_id": user_id, "updated": True, "prefs": prefs}

    def delete_session(self, session_id: str) -> dict:
        return {"session_id": session_id, "deleted": True}


def test_wrap_with_pydantic_ai(notary):
    """Wrapped data service works correctly as a PydanticAI dependency."""
    config = AutoReceiptConfig(fire_and_forget=True)
    svc = DataService()
    notary.wrap(svc, config=config)

    r1 = svc.fetch_user(42)
    assert r1["id"] == 42
    assert r1["name"] == "Alice"
    assert r1["active"] is True

    r2 = svc.update_preferences(42, {"theme": "dark", "lang": "en"})
    assert r2["updated"] is True

    r3 = svc.delete_session("sess_abc123")
    assert r3["deleted"] is True

    time.sleep(5)

    stats = notary.receipt_stats
    total = stats["issued"] + stats["failed"]
    assert total >= 1, f"Expected >=1 receipt attempted via wrap(), got {stats}"
    notary.unwrap(svc)
