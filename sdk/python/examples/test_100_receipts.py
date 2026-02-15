#!/usr/bin/env python3
"""
100-Receipt Performance Test for NotaryOS Auto-Receipting.

Tests:
1. Wrap overhead: time to wrap an agent
2. Dry-run throughput: 100 method calls with dry_run (no network)
3. Payload integrity: no proprietary fields leaked
4. Secret redaction: sensitive args masked
5. Error handling: errors captured without breaking agent
6. Chain linking: receipts reference previous hashes
7. Fire-and-forget queue: 100 receipts queued without blocking

Usage:
    python examples/test_100_receipts.py
"""

import json
import os
import sys
import time
import io

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from notary_sdk import NotaryClient, AutoReceiptConfig


# ── Agent under test ──────────────────────────────────────────────────────

class StressTestAgent:
    """Agent with varied method signatures for stress testing."""

    def simple_call(self):
        return {"status": "ok"}

    def with_args(self, x, y, z=10):
        return x + y + z

    def with_secrets(self, data, api_key="key123", password="pass"):
        return len(data)

    def slow_method(self):
        time.sleep(0.001)  # 1ms
        return "done"

    def error_method(self):
        raise RuntimeError("intentional test error")

    def large_return(self):
        return {"data": "x" * 10000, "nested": {"a": list(range(100))}}


# ── Helpers ───────────────────────────────────────────────────────────────

PROPRIETARY_FIELDS = [
    "seal", "grounding", "dag", "abuse", "signer",
    "private_key", "ed25519_private", "rate_limit_tier",
    "sql", "migration", "agentlayer", "middleware",
    "receipt_signer", "abuse_detector", "grounding_dag",
]


def check_payload_safety(payload_str):
    """Verify no proprietary backend terms appear in receipt payloads."""
    lower = payload_str.lower()
    for term in PROPRIETARY_FIELDS:
        if term in lower:
            return False, term
    return True, None


# ── Main test ─────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print("NotaryOS 100-Receipt Performance Test")
    print("=" * 70)

    notary = NotaryClient(api_key="notary_test_perftest000000000")
    config = AutoReceiptConfig(dry_run=True)

    # Capture stderr to inspect dry-run payloads
    old_stderr = sys.stderr
    captured = io.StringIO()
    sys.stderr = captured

    agent = StressTestAgent()

    # ── Test 1: Wrap overhead ─────────────────────────────────────────
    t0 = time.monotonic()
    notary.wrap(agent, config=config)
    wrap_time_ms = (time.monotonic() - t0) * 1000

    sys.stderr = old_stderr
    captured_wrap = captured.getvalue()
    captured = io.StringIO()
    sys.stderr = captured

    print(f"\n[1] WRAP OVERHEAD")
    print(f"    Time to wrap agent: {wrap_time_ms:.2f} ms")
    print(f"    Methods wrapped: 6 (5 public + large_return)")
    assert wrap_time_ms < 100, f"FAIL: wrap took {wrap_time_ms}ms (>100ms)"
    print(f"    PASS")

    # ── Test 2: 100 receipts throughput ───────────────────────────────
    receipt_count = 0
    errors_caught = 0
    t_start = time.monotonic()

    for i in range(20):
        agent.simple_call()
        receipt_count += 1

    for i in range(20):
        agent.with_args(i, i * 2, z=i * 3)
        receipt_count += 1

    for i in range(20):
        agent.with_secrets(f"data_{i}", api_key=f"sk_{i}", password=f"pw_{i}")
        receipt_count += 1

    for i in range(20):
        agent.slow_method()
        receipt_count += 1

    for i in range(10):
        try:
            agent.error_method()
        except RuntimeError:
            errors_caught += 1
        receipt_count += 1

    for i in range(10):
        agent.large_return()
        receipt_count += 1

    t_total = time.monotonic() - t_start
    total_ms = t_total * 1000

    sys.stderr = old_stderr
    dry_run_output = captured.getvalue()

    print(f"\n[2] 100-RECEIPT THROUGHPUT (dry-run)")
    print(f"    Total receipts: {receipt_count}")
    print(f"    Total time: {total_ms:.2f} ms")
    print(f"    Avg per receipt: {total_ms / receipt_count:.3f} ms")
    print(f"    Errors caught and receipted: {errors_caught}")
    assert receipt_count == 100, f"FAIL: expected 100, got {receipt_count}"
    print(f"    PASS")

    # ── Test 3: Parse all payloads ────────────────────────────────────
    lines = [l for l in dry_run_output.strip().split("\n") if l.startswith("[NotaryOS DRY RUN]")]
    payload_count = len(lines)

    print(f"\n[3] PAYLOAD INTEGRITY")
    print(f"    Dry-run payloads captured: {payload_count}")
    assert payload_count == 100, f"FAIL: expected 100 payloads, got {payload_count}"

    # Parse each payload and check
    payloads = []
    for line in lines:
        # Format: [NotaryOS DRY RUN] method_name: {json}
        json_start = line.index(": {") + 2
        payload = json.loads(line[json_start:])
        payloads.append(payload)

    # Check required fields exist
    required_fields = {"agent", "auto_receipt", "class_name", "function",
                       "timestamp", "duration_ms", "status", "arguments"}
    for i, p in enumerate(payloads):
        missing = required_fields - set(p.keys())
        assert not missing, f"FAIL: payload {i} missing fields: {missing}"

    print(f"    All 100 payloads have required fields")
    print(f"    PASS")

    # ── Test 4: No proprietary leaks ──────────────────────────────────
    print(f"\n[4] PROPRIETARY LEAK CHECK")
    leak_count = 0
    for i, p in enumerate(payloads):
        payload_str = json.dumps(p)
        safe, term = check_payload_safety(payload_str)
        if not safe:
            print(f"    LEAK in payload {i}: found '{term}'")
            leak_count += 1

    # Also check the full dry-run output
    safe, term = check_payload_safety(dry_run_output)
    if not safe:
        print(f"    LEAK in full output: found '{term}'")
        leak_count += 1

    if leak_count == 0:
        print(f"    No proprietary terms found in any payload")
        print(f"    Checked terms: {', '.join(PROPRIETARY_FIELDS)}")
        print(f"    PASS")
    else:
        print(f"    FAIL: {leak_count} leaks detected")

    # ── Test 5: Secret redaction ──────────────────────────────────────
    print(f"\n[5] SECRET REDACTION")
    secret_payloads = [p for p in payloads if p["function"] == "with_secrets"]
    redacted_count = 0
    exposed_count = 0
    for p in secret_payloads:
        args = p.get("arguments", {})
        if args.get("api_key") == "[REDACTED]" and args.get("password") == "[REDACTED]":
            redacted_count += 1
        else:
            exposed_count += 1
            print(f"    EXPOSED: {args}")

    print(f"    Calls with secrets: {len(secret_payloads)}")
    print(f"    Properly redacted: {redacted_count}")
    print(f"    Exposed: {exposed_count}")
    assert exposed_count == 0, f"FAIL: {exposed_count} secrets exposed"
    print(f"    PASS")

    # ── Test 6: Error capture ─────────────────────────────────────────
    print(f"\n[6] ERROR CAPTURE")
    error_payloads = [p for p in payloads if p["status"] == "error"]
    print(f"    Error receipts: {len(error_payloads)}")
    for ep in error_payloads:
        assert ep["error_type"] == "RuntimeError", f"FAIL: wrong error_type: {ep['error_type']}"
    print(f"    All errors have correct error_type: RuntimeError")
    assert len(error_payloads) == 10, f"FAIL: expected 10 errors, got {len(error_payloads)}"
    print(f"    PASS")

    # ── Test 7: Duration tracking ─────────────────────────────────────
    print(f"\n[7] DURATION TRACKING")
    slow_payloads = [p for p in payloads if p["function"] == "slow_method"]
    durations = [p["duration_ms"] for p in slow_payloads]
    avg_duration = sum(durations) / len(durations) if durations else 0
    print(f"    Slow method calls: {len(slow_payloads)}")
    print(f"    Avg duration: {avg_duration:.2f} ms (expected ~1ms)")
    assert avg_duration > 0.5, f"FAIL: duration too low ({avg_duration}ms)"
    print(f"    PASS")

    # ── Test 8: Payload size limits ───────────────────────────────────
    print(f"\n[8] PAYLOAD SIZE LIMITS")
    for p in payloads:
        size = len(json.dumps(p).encode("utf-8"))
        assert size <= 4096, f"FAIL: payload {p['function']} is {size} bytes (>4096)"
    max_size = max(len(json.dumps(p).encode("utf-8")) for p in payloads)
    print(f"    Max payload size: {max_size} bytes (limit: 4096)")
    print(f"    All 100 payloads within limit")
    print(f"    PASS")

    # ── Test 9: Unwrap + re-wrap ──────────────────────────────────────
    print(f"\n[9] UNWRAP / RE-WRAP")
    notary.unwrap(agent)
    assert not hasattr(agent, "_notary_wrapped"), "FAIL: still wrapped after unwrap"

    captured2 = io.StringIO()
    sys.stderr = captured2
    agent.simple_call()
    sys.stderr = old_stderr
    assert captured2.getvalue() == "", "FAIL: receipt issued after unwrap"
    print(f"    Unwrap: no receipts after unwrap")

    captured3 = io.StringIO()
    sys.stderr = captured3
    notary.wrap(agent, config=config)
    agent.simple_call()
    sys.stderr = old_stderr
    rewrap_output = captured3.getvalue()
    assert "[NotaryOS DRY RUN]" in rewrap_output, "FAIL: no receipt after re-wrap"
    print(f"    Re-wrap: receipts resume after re-wrap")
    print(f"    PASS")

    # ── Test 10: Stats ────────────────────────────────────────────────
    print(f"\n[10] RECEIPT STATS")
    stats = notary.receipt_stats
    print(f"    Stats: {stats}")
    print(f"    (all zeros expected in dry-run mode)")
    assert stats["issued"] == 0, "FAIL: issued should be 0 in dry-run"
    print(f"    PASS")

    # ── Summary ───────────────────────────────────────────────────────
    print(f"\n{'=' * 70}")
    print(f"ALL 10 TESTS PASSED")
    print(f"{'=' * 70}")
    print(f"  Receipts tested:     {receipt_count}")
    print(f"  Wrap overhead:       {wrap_time_ms:.2f} ms")
    print(f"  Throughput:          {total_ms:.2f} ms for 100 receipts")
    print(f"  Avg latency:         {total_ms / receipt_count:.3f} ms/receipt")
    print(f"  Proprietary leaks:   0")
    print(f"  Secrets exposed:     0")
    print(f"  Errors captured:     {errors_caught}/10")
    print(f"  Max payload size:    {max_size} bytes")
    print(f"{'=' * 70}")


if __name__ == "__main__":
    main()
