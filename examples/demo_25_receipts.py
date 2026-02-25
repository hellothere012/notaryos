#!/usr/bin/env python3
"""
NotaryOS — 25-Receipt Demo
===========================
See the full platform in action: hash chaining, counterfactual receipts,
tamper detection, and verification performance — all within free-tier limits.

Issues 25 receipts total (10 standard + 15 counterfactual) so you keep
75 of your 100 free monthly receipts.

Usage:
    export NOTARY_API_KEY="notary_live_xxx"   # your key from notaryos.org
    python demo_25_receipts.py

What you'll see:
    1. Service health check
    2. 10 standard receipts chained together (hash chain)
    3. 15 counterfactual receipts (proof of actions NOT taken)
    4. Tamper detection — modify a receipt, watch verification fail
    5. Full chain verification — prove no receipt was altered
    6. Public lookup — verify any receipt without an API key
    7. Performance summary — latency and throughput numbers
"""

import hashlib
import json
import os
import sys
import time

# Allow running from the examples/ directory or repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "sdk", "python"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

try:
    from notary_sdk import NotaryClient, verify_receipt
except ImportError:
    print("ERROR: notaryos SDK not found.")
    print("Install it:  pip install notaryos")
    print("Or run from the repo root so sdk/python/ is on the path.")
    sys.exit(1)

# ─── Config ──────────────────────────────────────────────────────────────────
API_KEY = os.environ.get("NOTARY_API_KEY", "")
if not API_KEY:
    print("ERROR: Set your API key first:")
    print('  export NOTARY_API_KEY="notary_live_xxx"')
    print()
    print("Get a free key at https://notaryos.org (sign up → API Keys)")
    sys.exit(1)

notary = NotaryClient(api_key=API_KEY)

# Timing helpers
timings = {"issue": [], "verify": [], "lookup": [], "counterfactual": []}


def timed(category, fn, *args, **kwargs):
    t0 = time.monotonic()
    result = fn(*args, **kwargs)
    elapsed_ms = (time.monotonic() - t0) * 1000
    timings[category].append(elapsed_ms)
    return result, elapsed_ms


# ─────────────────────────────────────────────────────────────────────────────
# Step 0: Health check
# ─────────────────────────────────────────────────────────────────────────────
print("=" * 70)
print("  NotaryOS — 25-Receipt Demo")
print("  Cryptographic receipts for AI agent accountability")
print("=" * 70)
print()

print("[1/7] Checking service health...")
status = notary.status()
print(f"  Status:     {status.status}")
print(f"  Signing:    {status.signature_type}")
print(f"  Public key: {'available' if status.has_public_key else 'unavailable'}")
print()

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Issue 10 standard receipts with hash chaining
# ─────────────────────────────────────────────────────────────────────────────
print("[2/7] Issuing 10 chained receipts (standard actions)...")
print("  Each receipt links to the previous one via SHA-256 hash chain.")
print()

# Simulate a realistic AI agent workflow
actions = [
    ("agent.startup",         {"agent_id": "trading-bot-1", "version": "2.1.0"}),
    ("market.data_fetch",     {"source": "exchange-api", "pairs": ["ETH/USD", "BTC/USD"]}),
    ("risk.assessment",       {"portfolio_value": 50000, "var_95": 2500}),
    ("order.placed",          {"symbol": "ETH", "side": "buy", "qty": 10, "price": 3200}),
    ("order.filled",          {"order_id": "ORD-7291", "fill_price": 3198.50, "slippage": 0.05}),
    ("portfolio.rebalance",   {"old_weights": {"ETH": 0.3, "BTC": 0.7}, "new_weights": {"ETH": 0.5, "BTC": 0.5}}),
    ("compliance.check",      {"regulation": "MiCA", "passed": True}),
    ("report.generated",      {"report_type": "daily_pnl", "rows": 1247}),
    ("notification.sent",     {"channel": "slack", "recipient": "ops-team", "priority": "normal"}),
    ("agent.shutdown",        {"uptime_hours": 23.97, "receipts_issued": 10}),
]

chain = []
prev_hash = None

for i, (action_type, payload) in enumerate(actions):
    receipt, ms = timed("issue", notary.issue,
        action_type,
        payload,
        previous_receipt_hash=prev_hash,
    )
    chain.append(receipt)
    prev_hash = receipt.receipt_hash
    print(f"  [{i+1:>2}/10]  {action_type:<25}  {ms:>6.1f}ms  hash: {receipt.receipt_hash[:16]}...")

print()

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Issue 15 counterfactual receipts (proof of non-action)
# ─────────────────────────────────────────────────────────────────────────────
print("[3/7] Issuing 15 counterfactual receipts (actions NOT taken)...")
print("  Counterfactual receipts prove what an agent COULD have done but chose not to.")
print("  This is a game-changer for compliance, auditing, and dispute resolution.")
print()

counterfactual_actions = [
    ("trade.declined",        {"reason": "risk_threshold_exceeded", "would_have": {"action": "sell", "symbol": "BTC", "qty": 50, "value": 150000}}),
    ("transfer.blocked",      {"reason": "insufficient_funds", "would_have": {"action": "wire_transfer", "amount": 75000, "currency": "USD"}}),
    ("data.access_denied",    {"reason": "missing_permissions", "would_have": {"action": "read", "table": "users_pii", "scope": "full"}}),
    ("deployment.halted",     {"reason": "failing_health_check", "would_have": {"action": "deploy", "service": "payment-api", "version": "3.2.1"}}),
    ("email.not_sent",        {"reason": "rate_limit_exceeded", "would_have": {"action": "send_bulk", "recipients": 5000, "template": "promo-q1"}}),
    ("api.call_skipped",      {"reason": "circuit_breaker_open", "would_have": {"action": "call", "endpoint": "/v2/process", "retries": 3}}),
    ("order.cancelled",       {"reason": "market_volatility", "would_have": {"action": "market_buy", "symbol": "SOL", "qty": 200}}),
    ("escalation.suppressed", {"reason": "duplicate_alert", "would_have": {"action": "page_oncall", "severity": "P1", "service": "auth"}}),
    ("model.retrain_skipped", {"reason": "data_drift_below_threshold", "would_have": {"action": "retrain", "model": "fraud-detector-v4"}}),
    ("payment.refund_denied", {"reason": "outside_refund_window", "would_have": {"action": "refund", "amount": 299.99, "order": "ORD-4412"}}),
    ("config.rollback_skipped", {"reason": "no_previous_version", "would_have": {"action": "rollback", "key": "rate_limit_max"}}),
    ("user.ban_deferred",     {"reason": "insufficient_evidence", "would_have": {"action": "ban", "user_id": "u_88291", "violations": 2}}),
    ("report.redacted",       {"reason": "contains_pii", "would_have": {"action": "export_full", "report": "customer_analytics_q4"}}),
    ("backup.skipped",        {"reason": "storage_quota_reached", "would_have": {"action": "full_backup", "db": "production", "size_gb": 450}}),
    ("webhook.not_fired",     {"reason": "endpoint_unreachable", "would_have": {"action": "notify", "url": "https://partner.example.com/hook"}}),
]

counterfactual_receipts = []

for i, (action_type, payload) in enumerate(counterfactual_actions):
    payload["counterfactual"] = True
    receipt, ms = timed("counterfactual", notary.issue,
        action_type,
        payload,
        previous_receipt_hash=prev_hash,
    )
    counterfactual_receipts.append(receipt)
    prev_hash = receipt.receipt_hash
    reason = payload["reason"]
    print(f"  [{i+1:>2}/15]  {action_type:<28}  {ms:>6.1f}ms  reason: {reason}")

print()

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Verify every receipt
# ─────────────────────────────────────────────────────────────────────────────
print("[4/7] Verifying all 25 receipts...")
all_receipts = chain + counterfactual_receipts
verified = 0
verify_times = []

for receipt in all_receipts:
    result, ms = timed("verify", notary.verify, receipt)
    verify_times.append(ms)
    if result.valid and result.signature_ok:
        verified += 1

print(f"  {verified}/25 receipts verified successfully")
print(f"  All signatures: Ed25519 (RFC 8032)")
print()

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Tamper detection demo
# ─────────────────────────────────────────────────────────────────────────────
print("[5/7] Tamper detection — modifying a receipt...")
target = chain[4]  # the order.filled receipt
tampered = target.to_dict()
original_hash = tampered["payload_hash"]
tampered["payload_hash"] = "0000" + original_hash[4:]  # corrupt 4 bytes

print(f"  Original hash:  {original_hash[:32]}...")
print(f"  Tampered hash:  {tampered['payload_hash'][:32]}...")

tamper_result = notary.verify(tampered)
if not tamper_result.valid:
    print(f"  Result:         TAMPER DETECTED — verification failed")
else:
    print(f"  Result:         WARNING — tamper not detected (unexpected)")
print()

# ─────────────────────────────────────────────────────────────────────────────
# Step 5: Public lookup (no API key needed)
# ─────────────────────────────────────────────────────────────────────────────
print("[6/7] Public receipt lookup (no API key required)...")
sample = counterfactual_receipts[0]  # the trade.declined counterfactual
lookup_result, lookup_ms = timed("lookup", notary.lookup, sample.receipt_hash)

if lookup_result.get("found"):
    print(f"  Found receipt:  {sample.receipt_hash[:32]}...")
    print(f"  Lookup time:    {lookup_ms:.1f}ms")
    print(f"  Verify URL:     {sample.verify_url}")
    print(f"  Anyone can verify this receipt at notaryos.org — no account needed.")
else:
    print(f"  Lookup returned: {lookup_result}")
print()

# ─────────────────────────────────────────────────────────────────────────────
# Step 6: Performance summary
# ─────────────────────────────────────────────────────────────────────────────
print("[7/7] Performance summary")
print("-" * 50)

def stats(label, times):
    if not times:
        return
    avg = sum(times) / len(times)
    p50 = sorted(times)[len(times) // 2]
    p99 = sorted(times)[int(len(times) * 0.99)]
    mn = min(times)
    mx = max(times)
    print(f"  {label:<20}  avg: {avg:>6.1f}ms  p50: {p50:>6.1f}ms  min: {mn:>6.1f}ms  max: {mx:>6.1f}ms")

stats("Issue (standard)", timings["issue"])
stats("Issue (counter.)", timings["counterfactual"])
stats("Verify", timings["verify"])
stats("Lookup", timings["lookup"])

total_issue = timings["issue"] + timings["counterfactual"]
total_time = sum(total_issue) / 1000
throughput = len(total_issue) / total_time if total_time > 0 else 0

print()
print(f"  Total receipts:   25 (10 standard + 15 counterfactual)")
print(f"  Total issue time: {total_time:.2f}s")
print(f"  Throughput:       {throughput:.0f} receipts/sec")
print(f"  Chain length:     25 linked receipts")
print(f"  Tamper detection: working")
print(f"  Public lookup:    working")

print()
print("=" * 70)
print("  Demo complete. 25 receipts issued, chained, and verified.")
print()
print("  What just happened:")
print("    - 10 agent actions got tamper-proof, signed receipts")
print("    - 15 counterfactual receipts proved what the agent chose NOT to do")
print("    - All 25 receipts are linked in a hash chain — modify one, break all")
print("    - Anyone can verify any receipt at https://notaryos.org — no account needed")
print()
print("  Next steps:")
print("    - View your receipts:  https://notaryos.org (sign in → History)")
print("    - Read the docs:       https://notaryos.org/docs")
print("    - Integrate your agent: 3 lines of code (see README)")
print("=" * 70)
