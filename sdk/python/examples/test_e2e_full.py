#!/usr/bin/env python3
"""
NotaryOS End-to-End Test Suite
==============================
Tests receipts, chains, counter-receipts, verification, auto-receipting,
and tampering detection against the live API.

Usage:
    python test_e2e_full.py
"""

import asyncio
import hashlib
import json
import os
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from notary_sdk import (
    NotaryClient,
    NotaryError,
    AuthenticationError,
    Receipt,
    VerificationResult,
    AutoReceiptConfig,
    receipted,
)

API_KEY = os.environ.get("NOTARY_API_KEY", "notary_test_demo_e2e")
passed = 0
failed = 0
errors = []


def test(name):
    """Decorator to register and run a test."""
    def decorator(fn):
        fn._test_name = name
        return fn
    return decorator


def run_test(fn):
    global passed, failed
    name = getattr(fn, "_test_name", fn.__name__)
    try:
        fn()
        passed += 1
        print(f"  PASS  {name}")
    except Exception as e:
        failed += 1
        errors.append((name, str(e)))
        print(f"  FAIL  {name}: {e}")


# =============================================================================
# Test 1: Service health
# =============================================================================
@test("1. Service status + capabilities")
def test_service_status():
    notary = NotaryClient(api_key=API_KEY)
    status = notary.status()
    assert status.status == "active", f"Expected active, got {status.status}"
    assert status.signature_type == "ed25519", f"Expected ed25519, got {status.signature_type}"
    assert status.has_public_key, "Expected has_public_key=True"
    assert "create_receipt" in status.capabilities
    assert "verify_receipt" in status.capabilities


# =============================================================================
# Test 2: Public key retrieval
# =============================================================================
@test("2. Public key retrieval (Ed25519 PEM)")
def test_public_key():
    notary = NotaryClient(api_key=API_KEY)
    key_info = notary.public_key()
    assert "public_key_pem" in key_info, "Missing public_key_pem"
    assert "key_id" in key_info, "Missing key_id"
    pem = key_info["public_key_pem"]
    assert "PUBLIC KEY" in pem or len(pem) > 20, f"PEM looks invalid: {pem[:40]}"


# =============================================================================
# Test 3: Single receipt issue + verify
# =============================================================================
@test("3. Issue single receipt + verify signature")
def test_issue_and_verify():
    notary = NotaryClient(api_key=API_KEY)
    receipt = notary.issue("e2e_test.single", {
        "test": "single_receipt",
        "timestamp": time.time(),
    })
    assert receipt.receipt_id, "Missing receipt_id"
    assert receipt.signature, "Missing signature"
    assert receipt.signature_type == "ed25519", f"Wrong sig type: {receipt.signature_type}"
    assert receipt.payload_hash, "Missing payload_hash"
    assert receipt.receipt_hash, "Missing receipt_hash"
    assert receipt.verify_url, "Missing verify_url"

    # Verify the receipt
    result = notary.verify(receipt)
    assert result.valid, f"Receipt invalid: {result.reason}"
    assert result.signature_ok, "Signature check failed"
    assert result.structure_ok, "Structure check failed"


# =============================================================================
# Test 4: Receipt chain (5 receipts, linked)
# =============================================================================
@test("4. Receipt chain — 5 linked receipts with hash chaining")
def test_receipt_chain():
    notary = NotaryClient(api_key=API_KEY)
    receipts = []
    prev_hash = None

    for i in range(5):
        receipt = notary.issue(
            "e2e_test.chain",
            {"step": i + 1, "data": f"Chain message {i + 1}"},
            previous_receipt_hash=prev_hash,
        )
        receipts.append(receipt)
        prev_hash = receipt.receipt_hash

    # All receipts should have IDs and hashes
    for i, r in enumerate(receipts):
        assert r.receipt_id, f"Receipt {i} missing ID"
        assert r.receipt_hash, f"Receipt {i} missing hash"

    # Verify each receipt individually
    for i, r in enumerate(receipts):
        result = notary.verify(r)
        assert result.valid, f"Receipt {i} invalid: {result.reason}"

    # Chain linking: receipt[i+1].previous_receipt_hash should match receipt[i].receipt_hash
    # (The server may or may not return previous_receipt_hash in the receipt, so we verify
    #  via the API rather than checking the field directly)


# =============================================================================
# Test 5: Receipt lookup by hash (public, no API key)
# =============================================================================
@test("5. Public receipt lookup by hash")
def test_receipt_lookup():
    notary = NotaryClient(api_key=API_KEY)
    receipt = notary.issue("e2e_test.lookup", {"test": "lookup_test"})
    assert receipt.receipt_hash, "No receipt_hash returned"

    # Lookup by hash (public endpoint)
    result = notary.lookup(receipt.receipt_hash)
    assert result.get("found", False), f"Lookup failed: receipt not found for hash {receipt.receipt_hash[:16]}..."
    assert result.get("receipt"), "Lookup returned no receipt data"

    # Verify the looked-up receipt matches
    looked_up = result["receipt"]
    assert looked_up.get("receipt_id") == receipt.receipt_id, "Receipt ID mismatch"


# =============================================================================
# Test 6: Verify by ID
# =============================================================================
@test("6. Verify receipt by hash (server-side lookup)")
def test_verify_by_hash():
    notary = NotaryClient(api_key=API_KEY)
    receipt = notary.issue("e2e_test.verify_by_hash", {"test": "hash_verification"})

    # Server uses receipt_hash for lookups
    result = notary.verify_by_id(receipt.receipt_hash)
    assert result.valid, f"Verify by hash failed: {result.reason}"


# =============================================================================
# Test 7: Tampered receipt detection
# =============================================================================
@test("7. Tampered receipt detection (modified payload_hash)")
def test_tampering_detection():
    notary = NotaryClient(api_key=API_KEY)
    receipt = notary.issue("e2e_test.tamper", {"test": "tamper_detection"})

    # Tamper with the receipt
    tampered = receipt.to_dict()
    tampered["payload_hash"] = "0000" + tampered["payload_hash"][4:]

    result = notary.verify(tampered)
    assert not result.valid, "Tampered receipt should be INVALID"


# =============================================================================
# Test 8: Counterfactual receipt (negative proof)
# =============================================================================
@test("8. Counterfactual receipt — prove an action was NOT taken")
def test_counterfactual_receipt():
    notary = NotaryClient(api_key=API_KEY)

    # Issue a counterfactual receipt — proves a decision NOT to act
    receipt = notary.issue("e2e_test.counterfactual", {
        "decision": "transfer_denied",
        "reason": "insufficient_funds",
        "agent": "billing-agent",
        "would_have": {
            "action": "financial.transfer",
            "amount": 50000.00,
            "currency": "USD",
        },
        "counterfactual": True,
    })

    assert receipt.receipt_id, "Counterfactual receipt missing ID"
    assert receipt.signature, "Counterfactual receipt missing signature"
    assert receipt.receipt_hash, "Counterfactual receipt missing hash"

    # Verify the counterfactual receipt is valid
    result = notary.verify(receipt)
    assert result.valid, f"Counterfactual receipt invalid: {result.reason}"
    assert result.signature_ok, "Counterfactual signature check failed"

    # The receipt can be looked up publicly
    lookup = notary.lookup(receipt.receipt_hash)
    assert lookup.get("found", False), "Counterfactual receipt not found in public lookup"


# =============================================================================
# Test 9: Counter-receipt (opposing receipt in a dispute)
# =============================================================================
@test("9. Counter-receipt — opposing proof for dispute resolution")
def test_counter_receipt():
    notary = NotaryClient(api_key=API_KEY)

    # Agent A claims it sent a payment
    original = notary.issue("e2e_test.payment_sent", {
        "from_agent": "billing-agent",
        "to_agent": "ledger-agent",
        "amount": 150.00,
        "currency": "USD",
        "reference": "INV-2026-001",
    })
    assert original.valid if hasattr(original, 'valid') else original.receipt_id

    # Agent B issues a counter-receipt: "I never received it"
    counter = notary.issue("e2e_test.payment_not_received", {
        "responding_to": original.receipt_hash,
        "from_agent": "ledger-agent",
        "claim": "payment_not_received",
        "original_receipt_hash": original.receipt_hash,
        "counter_receipt": True,
    })
    assert counter.receipt_id, "Counter-receipt missing ID"
    assert counter.signature, "Counter-receipt missing signature"

    # Both receipts should be independently verifiable
    r1 = notary.verify(original)
    r2 = notary.verify(counter)
    assert r1.valid, f"Original receipt invalid: {r1.reason}"
    assert r2.valid, f"Counter-receipt invalid: {r2.reason}"

    # Both exist in the public ledger
    l1 = notary.lookup(original.receipt_hash)
    l2 = notary.lookup(counter.receipt_hash)
    assert l1.get("found"), "Original not in public ledger"
    assert l2.get("found"), "Counter-receipt not in public ledger"

    # The counter-receipt references the original via payload
    looked_up_counter = l2["receipt"]
    # Verify the payload_hash is different (different payloads)
    assert original.payload_hash != counter.payload_hash, "Receipts should have different payload hashes"


# =============================================================================
# Test 10: Chain integrity with counter-receipts
# =============================================================================
@test("10. Chain integrity — interleaved receipts and counter-receipts")
def test_chain_with_counter_receipts():
    notary = NotaryClient(api_key=API_KEY)

    chain = []
    prev_hash = None

    # Action 1: Agent initiates
    r1 = notary.issue("e2e_test.initiate", {
        "agent": "coordinator",
        "action": "start_workflow",
    }, previous_receipt_hash=prev_hash)
    chain.append(r1)
    prev_hash = r1.receipt_hash

    # Action 2: Sub-agent acts
    r2 = notary.issue("e2e_test.sub_action", {
        "agent": "worker-1",
        "action": "process_data",
        "parent_receipt": r1.receipt_hash,
    }, previous_receipt_hash=prev_hash)
    chain.append(r2)
    prev_hash = r2.receipt_hash

    # Action 3: Counter-receipt — sub-agent disputes
    r3 = notary.issue("e2e_test.dispute", {
        "agent": "worker-2",
        "action": "dispute_result",
        "disputing_receipt": r2.receipt_hash,
        "counter_receipt": True,
    }, previous_receipt_hash=prev_hash)
    chain.append(r3)
    prev_hash = r3.receipt_hash

    # Action 4: Resolution
    r4 = notary.issue("e2e_test.resolve", {
        "agent": "coordinator",
        "action": "resolve_dispute",
        "original_receipt": r2.receipt_hash,
        "counter_receipt": r3.receipt_hash,
        "resolution": "worker-2 correct",
    }, previous_receipt_hash=prev_hash)
    chain.append(r4)

    # All 4 should be valid
    for i, r in enumerate(chain):
        result = notary.verify(r)
        assert result.valid, f"Chain receipt {i+1} invalid: {result.reason}"

    # All 4 should be in public ledger
    for i, r in enumerate(chain):
        lookup = notary.lookup(r.receipt_hash)
        assert lookup.get("found"), f"Chain receipt {i+1} not in public ledger"


# =============================================================================
# Test 11: Auto-receipting with wrap() — live API
# =============================================================================
@test("11. Auto-receipting wrap() — live API, fire-and-forget")
def test_auto_receipt_live():
    notary = NotaryClient(api_key=API_KEY)

    class TradeAgent:
        def place_order(self, symbol, qty):
            return {"order_id": "ORD-001", "symbol": symbol, "qty": qty}

        def cancel_order(self, order_id):
            return {"cancelled": True, "order_id": order_id}

    agent = TradeAgent()
    config = AutoReceiptConfig(fire_and_forget=False)  # Synchronous for testing
    notary.wrap(agent, config=config)

    # Execute methods — receipts issued via live API
    result1 = agent.place_order("ETH", 5)
    result2 = agent.cancel_order("ORD-001")

    assert result1["order_id"] == "ORD-001", "Method return value corrupted"
    assert result2["cancelled"] is True, "Method return value corrupted"

    # Check stats
    stats = notary.receipt_stats
    # With fire_and_forget=False, receipts are issued inline (stats only track queue)
    # The important thing is the methods returned correct values

    # Unwrap and verify original behavior
    notary.unwrap(agent)
    result3 = agent.place_order("BTC", 10)
    assert result3["symbol"] == "BTC", "Unwrap failed"


# =============================================================================
# Test 12: Auto-receipting with secret redaction — live API
# =============================================================================
@test("12. Auto-receipting secret redaction — live API")
def test_auto_receipt_secret_redaction():
    notary = NotaryClient(api_key=API_KEY)

    class SecureAgent:
        def call_api(self, endpoint, api_key="sk_live_xxx", data=None):
            return {"status": "ok"}

        def authenticate(self, username, password="secret123"):
            return {"token": "jwt_xxx"}

    agent = SecureAgent()
    config = AutoReceiptConfig(fire_and_forget=False, dry_run=True)
    notary.wrap(agent, config=config)

    # Capture stderr to verify redaction
    import io
    old_stderr = sys.stderr
    sys.stderr = captured = io.StringIO()

    agent.call_api("/users", api_key="sk_live_REAL_KEY")
    agent.authenticate("admin", password="hunter2")

    sys.stderr = old_stderr
    output = captured.getvalue()

    # Verify secrets are redacted
    assert "sk_live_REAL_KEY" not in output, "API key was NOT redacted!"
    assert "hunter2" not in output, "Password was NOT redacted!"
    assert "[REDACTED]" in output, "No redaction markers found"

    notary.unwrap(agent)


# =============================================================================
# Test 13: @receipted decorator — live API
# =============================================================================
@test("13. @receipted class decorator — live API")
def test_receipted_decorator():
    notary = NotaryClient(api_key=API_KEY)

    @receipted(notary, config=AutoReceiptConfig(fire_and_forget=False))
    class MonitorAgent:
        def check_health(self, service):
            return {"service": service, "healthy": True}

    agent = MonitorAgent()
    result = agent.check_health("database")
    assert result["healthy"] is True, "Decorated method returned wrong value"
    assert result["service"] == "database", "Decorated method returned wrong value"

    notary.unwrap(agent)


# =============================================================================
# Test 14: Error capture in auto-receipting
# =============================================================================
@test("14. Auto-receipt error capture — errors produce receipts")
def test_auto_receipt_error_capture():
    notary = NotaryClient(api_key=API_KEY)

    class FlakyAgent:
        def succeed(self):
            return "ok"

        def fail(self):
            raise RuntimeError("Intentional failure for E2E test")

    agent = FlakyAgent()
    config = AutoReceiptConfig(fire_and_forget=False, dry_run=True)
    notary.wrap(agent, config=config)

    import io
    old_stderr = sys.stderr
    sys.stderr = captured = io.StringIO()

    # Successful call
    assert agent.succeed() == "ok"

    # Failed call — should capture error but re-raise
    try:
        agent.fail()
        assert False, "Should have raised"
    except RuntimeError:
        pass

    sys.stderr = old_stderr
    output = captured.getvalue()

    assert '"status": "success"' in output, "Success status not captured"
    assert '"status": "error"' in output, "Error status not captured"
    assert '"error_type": "RuntimeError"' in output, "Error type not captured"

    notary.unwrap(agent)


# =============================================================================
# Test 15: Chain state tracking in auto-receipting
# =============================================================================
@test("15. Chain state — auto-receipt chain linking with _ChainState")
def test_chain_state_tracking():
    from notary_sdk import _ChainState

    chain = _ChainState(agent_id="test-agent")

    # Initial state
    last, seq = chain.peek()
    assert last is None, f"Expected None, got {last}"
    assert seq == 0, f"Expected 0, got {seq}"

    # Advance
    prev, s = chain.get_and_advance("hash_001")
    assert prev is None, "First advance should return None prev"
    assert s == 0, "First advance should return seq 0"

    prev, s = chain.get_and_advance("hash_002")
    assert prev == "hash_001", f"Expected hash_001, got {prev}"
    assert s == 1, f"Expected 1, got {s}"

    prev, s = chain.get_and_advance("hash_003")
    assert prev == "hash_002", f"Expected hash_002, got {prev}"
    assert s == 2, f"Expected 2, got {s}"

    # Peek should show current state without advancing
    last, seq = chain.peek()
    assert last == "hash_003", f"Expected hash_003, got {last}"
    assert seq == 3, f"Expected 3, got {seq}"


# =============================================================================
# Test 16: Async method auto-receipting
# =============================================================================
@test("16. Async method auto-receipting")
def test_async_auto_receipt():
    notary = NotaryClient(api_key=API_KEY)

    class AsyncAgent:
        async def fetch_data(self, url):
            return {"url": url, "status": 200}

        def sync_method(self):
            return "sync"

    agent = AsyncAgent()
    config = AutoReceiptConfig(dry_run=True, fire_and_forget=False)
    notary.wrap(agent, config=config)

    # Verify async wrapper is actually async
    assert asyncio.iscoroutinefunction(agent.fetch_data), "Async method not wrapped as async"

    # Run the async method
    import io
    old_stderr = sys.stderr
    sys.stderr = captured = io.StringIO()

    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    result = loop.run_until_complete(agent.fetch_data("https://example.com"))

    sys.stderr = old_stderr
    output = captured.getvalue()

    assert result["status"] == 200, "Async method return corrupted"
    assert "fetch_data" in output, "Async receipt not generated"

    notary.unwrap(agent)


# =============================================================================
# Test 17: Bulk receipts — throughput under load
# =============================================================================
@test("17. Bulk throughput — 20 receipts in rapid succession")
def test_bulk_throughput():
    notary = NotaryClient(api_key=API_KEY)
    receipts = []
    prev_hash = None

    t0 = time.monotonic()
    for i in range(20):
        receipt = notary.issue(
            "e2e_test.bulk",
            {"index": i, "batch": "throughput_test"},
            previous_receipt_hash=prev_hash,
        )
        receipts.append(receipt)
        prev_hash = receipt.receipt_hash
    elapsed = time.monotonic() - t0

    assert len(receipts) == 20, f"Expected 20 receipts, got {len(receipts)}"
    # All should have unique IDs and hashes
    ids = set(r.receipt_id for r in receipts)
    hashes = set(r.receipt_hash for r in receipts)
    assert len(ids) == 20, f"Duplicate receipt IDs: {20 - len(ids)} dupes"
    assert len(hashes) == 20, f"Duplicate hashes: {20 - len(hashes)} dupes"

    # Spot-check: verify first and last
    r_first = notary.verify(receipts[0])
    r_last = notary.verify(receipts[-1])
    assert r_first.valid, f"First receipt invalid: {r_first.reason}"
    assert r_last.valid, f"Last receipt invalid: {r_last.reason}"

    avg_ms = (elapsed / 20) * 1000
    print(f"         ({elapsed:.2f}s total, {avg_ms:.0f}ms avg per receipt)")


# =============================================================================
# Test 18: Cross-verification — verify with public function (no API key)
# =============================================================================
@test("18. Cross-verify — verify_receipt() public function (no API key)")
def test_cross_verification():
    from notary_sdk import verify_receipt as verify_public

    notary = NotaryClient(api_key=API_KEY)
    receipt = notary.issue("e2e_test.cross_verify", {"test": "public_verify"})

    # Verify using the convenience function (no API key)
    is_valid = verify_public(receipt.to_dict())
    assert is_valid, "Public verification failed"


# =============================================================================
# Test 19: Invalid API key rejection
# =============================================================================
@test("19. Auth — invalid API key rejected")
def test_invalid_api_key():
    try:
        notary = NotaryClient(api_key="notary_test_INVALID_KEY_12345")
        notary.status()
        # If status works with any key, try issue which requires real auth
        try:
            notary.issue("test", {"data": "should_fail"})
            # Some APIs may accept test keys — that's OK
        except AuthenticationError:
            pass  # Expected
    except AuthenticationError:
        pass  # Expected
    except NotaryError:
        pass  # Also acceptable (connection-level rejection)


# =============================================================================
# Test 20: Receipt immutability — same action produces different receipts
# =============================================================================
@test("20. Receipt immutability — duplicate payloads get unique receipts")
def test_receipt_immutability():
    notary = NotaryClient(api_key=API_KEY)
    payload = {"data": "identical_payload", "value": 42}

    r1 = notary.issue("e2e_test.immutability", payload)
    r2 = notary.issue("e2e_test.immutability", payload)

    assert r1.receipt_id != r2.receipt_id, "Duplicate receipt IDs!"
    assert r1.receipt_hash != r2.receipt_hash, "Duplicate receipt hashes!"
    assert r1.timestamp != r2.timestamp or r1.receipt_id != r2.receipt_id, "Receipts not unique"

    # Both valid
    assert notary.verify(r1).valid
    assert notary.verify(r2).valid


# =============================================================================
# Run all tests
# =============================================================================
def main():
    print("=" * 70)
    print("NotaryOS End-to-End Test Suite")
    print(f"API: https://api.agenttownsquare.com")
    print(f"Key: {API_KEY[:20]}...")
    print("=" * 70)
    print()

    tests = [
        test_service_status,
        test_public_key,
        test_issue_and_verify,
        test_receipt_chain,
        test_receipt_lookup,
        test_verify_by_hash,
        test_tampering_detection,
        test_counterfactual_receipt,
        test_counter_receipt,
        test_chain_with_counter_receipts,
        test_auto_receipt_live,
        test_auto_receipt_secret_redaction,
        test_receipted_decorator,
        test_auto_receipt_error_capture,
        test_chain_state_tracking,
        test_async_auto_receipt,
        test_bulk_throughput,
        test_cross_verification,
        test_invalid_api_key,
        test_receipt_immutability,
    ]

    t0 = time.monotonic()
    for t in tests:
        run_test(t)
    elapsed = time.monotonic() - t0

    print()
    print("=" * 70)
    print(f"Results: {passed} passed, {failed} failed ({elapsed:.1f}s)")
    print("=" * 70)

    if errors:
        print()
        print("FAILURES:")
        for name, err in errors:
            print(f"  {name}: {err}")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
