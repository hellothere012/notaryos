"""
SDK Baseline Tests — gate for all framework integration tests.

If these fail, the API is unreachable or the SDK is broken.
No framework dependencies required.
"""

import time

from notary_sdk import AutoReceiptConfig


def test_status(notary_public):
    """Verify NotaryOS API is reachable and active (no auth needed)."""
    status = notary_public.status()
    assert status.status == "active", f"Expected active, got {status.status}"
    assert status.signature_type == "ed25519"
    assert status.has_public_key


def test_public_key(notary_public):
    """Verify public key endpoint returns PEM (no auth needed)."""
    key = notary_public.public_key()
    if isinstance(key, dict):
        pem = key.get("public_key_pem", "") or key.get("public_key", "")
    else:
        pem = getattr(key, "public_key_pem", "") or getattr(key, "public_key", "")
    assert "BEGIN PUBLIC KEY" in pem, f"No PEM found. Got: {key}"


def test_issue_and_verify(notary):
    """Round-trip: issue a receipt and verify its signature."""
    receipt = notary.issue(
        "integration_test.baseline",
        {"test": "sdk_baseline", "timestamp": time.time()},
    )
    assert receipt.receipt_id, "Missing receipt_id"
    assert receipt.signature, "Missing signature"
    assert receipt.receipt_hash, "Missing receipt_hash"

    result = notary.verify(receipt)
    assert result.valid, f"Receipt verification failed: {result.reason}"
    assert result.signature_ok, "Signature check failed"


def test_wrap_plain_object(notary):
    """Verify wrap() works on a plain Python object without any framework.

    Uses fire_and_forget=True (default) so receipts go through the
    background _ReceiptQueue which tracks stats. With fire_and_forget=False,
    receipt issuance is inline and stats aren't tracked — a known SDK design
    choice to keep the hot path allocation-free.
    """

    class Calculator:
        def add(self, a: int, b: int) -> int:
            return a + b

        def multiply(self, a: int, b: int) -> int:
            return a * b

    config = AutoReceiptConfig(fire_and_forget=True)
    calc = Calculator()
    notary.wrap(calc, config=config)

    # Methods should still return correct values
    assert calc.add(2, 3) == 5
    assert calc.multiply(4, 5) == 20

    # Object should be marked as wrapped
    assert getattr(calc, "_notary_wrapped", False) is True

    # Allow background queue to process
    time.sleep(5)

    stats = notary.receipt_stats
    total = stats["issued"] + stats["failed"]
    assert total >= 1, f"Expected >=1 receipt attempted, got {stats}"

    notary.unwrap(calc)
    assert not getattr(calc, "_notary_wrapped", False)
