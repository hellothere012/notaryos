"""
NotaryOS + CrewAI Integration Test

Proves wrap() works on service objects used within CrewAI agent workflows.
Multi-agent compliance scenario — the realistic pattern for CrewAI users.

Requires: pip install notaryos[crewai]
"""

import time

import pytest

pytest.importorskip("crewai", reason="crewai not installed")

from notary_sdk import AutoReceiptConfig  # noqa: E402


class ComplianceChecker:
    """Business logic wrapped by NotaryOS for audit trail."""

    def check_policy(self, document: str) -> dict:
        return {"compliant": True, "document": document, "score": 0.95}

    def flag_violation(self, rule: str) -> dict:
        return {"flagged": True, "rule": rule, "severity": "medium"}

    def generate_report(self, findings: list) -> dict:
        return {"report_id": "RPT-001", "findings_count": len(findings)}


def test_wrap_with_crewai(notary):
    """Wrapped compliance service works correctly in a CrewAI-compatible context."""
    config = AutoReceiptConfig(fire_and_forget=True)
    checker = ComplianceChecker()
    notary.wrap(checker, config=config)

    r1 = checker.check_policy("contract_v2.pdf")
    assert r1["compliant"] is True
    assert r1["score"] == 0.95

    r2 = checker.flag_violation("GDPR-17")
    assert r2["flagged"] is True
    assert r2["severity"] == "medium"

    r3 = checker.generate_report(["finding_1", "finding_2"])
    assert r3["findings_count"] == 2

    time.sleep(5)

    stats = notary.receipt_stats
    total = stats["issued"] + stats["failed"]
    assert total >= 1, f"Expected >=1 receipt attempted via wrap(), got {stats}"
    notary.unwrap(checker)
