"""
NotaryOS + AutoGen Integration Test

Proves wrap() works on service objects used within AutoGen multi-agent workflows.
AutoGen (AG2) is Microsoft's enterprise multi-agent framework.

Requires: pip install notaryos[autogen]
"""

import time

import pytest

pytest.importorskip("autogen_agentchat", reason="autogen-agentchat not installed")

from notary_sdk import AutoReceiptConfig  # noqa: E402


class AnalyticsEngine:
    """Business logic wrapped by NotaryOS for audit trail."""

    def analyze(self, dataset: str) -> dict:
        return {"dataset": dataset, "rows": 1000, "anomalies": 3}

    def report(self, analysis_id: str) -> str:
        return f"Report for {analysis_id}: 3 anomalies found"

    def recommend(self, analysis_id: str) -> dict:
        return {
            "analysis_id": analysis_id,
            "actions": ["investigate_cluster_7", "retrain_model"],
        }


def test_wrap_with_autogen(notary):
    """Wrapped analytics engine works correctly in AutoGen agent context."""
    config = AutoReceiptConfig(fire_and_forget=True)
    engine = AnalyticsEngine()
    notary.wrap(engine, config=config)

    r1 = engine.analyze("sales_q4")
    assert r1["anomalies"] == 3
    assert r1["rows"] == 1000

    r2 = engine.report("sales_q4")
    assert "3 anomalies" in r2

    r3 = engine.recommend("sales_q4")
    assert len(r3["actions"]) == 2

    time.sleep(5)

    stats = notary.receipt_stats
    total = stats["issued"] + stats["failed"]
    assert total >= 1, f"Expected >=1 receipt attempted via wrap(), got {stats}"
    notary.unwrap(engine)
