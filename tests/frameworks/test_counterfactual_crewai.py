"""
Counterfactual Receipt Test — Multi-Agent Compliance Scenario

Proves NotaryOS can issue and verify counterfactual receipts (proof of non-action).
Uses the CrewAI multi-agent context where counterfactuals are most valuable:
"Agent A could have escalated but chose not to."

Only one framework needs this test since counterfactuals are SDK-level, not
framework-level. CrewAI was chosen because multi-agent scenarios are where
counterfactuals shine.

Note: Uses notary.issue() with counterfactual payload since the SDK does not
yet have a dedicated issue_counterfactual() method. The server endpoint exists
at POST /v1/notary/counterfactual/issue but has no SDK wrapper yet.
"""

import time


def test_counterfactual_receipt(notary):
    """Agent could have escalated but chose not to — prove restraint."""
    receipt = notary.issue(
        "compliance.escalation_declined",
        {
            "decision": "no_escalation",
            "reason": "risk_score_below_threshold",
            "agent": "compliance-checker",
            "counterfactual": True,
            "risk_score": 0.32,
            "threshold": 0.75,
            "would_have": {
                "action": "escalate_to_human",
                "severity": "medium",
                "regulation": "SOX-404",
            },
            "timestamp": time.time(),
        },
    )
    assert receipt.receipt_id, "Counterfactual receipt missing ID"
    assert receipt.signature, "Counterfactual receipt missing signature"
    assert receipt.receipt_hash, "Counterfactual receipt missing hash"

    # Verify the counterfactual receipt is cryptographically valid
    result = notary.verify(receipt)
    assert result.valid, f"Counterfactual receipt invalid: {result.reason}"
    assert result.signature_ok, "Counterfactual signature check failed"


def test_counterfactual_chain(notary):
    """Two agents in a chain: one acts, one declines — both receipted."""
    # Agent A acts
    action_receipt = notary.issue(
        "agent_a.data_processed",
        {"agent": "processor", "records": 500, "action": "process"},
    )
    assert action_receipt.receipt_hash

    # Agent B declines (counterfactual) — links to Agent A's receipt
    decline_receipt = notary.issue(
        "agent_b.action_declined",
        {
            "agent": "reviewer",
            "counterfactual": True,
            "decision": "no_review_needed",
            "reason": "all_records_below_threshold",
            "responding_to": action_receipt.receipt_hash,
        },
        previous_receipt_hash=action_receipt.receipt_hash,
    )
    assert decline_receipt.receipt_hash

    # Both should be independently verifiable
    r1 = notary.verify(action_receipt)
    r2 = notary.verify(decline_receipt)
    assert r1.valid, f"Action receipt invalid: {r1.reason}"
    assert r2.valid, f"Decline receipt invalid: {r2.reason}"
