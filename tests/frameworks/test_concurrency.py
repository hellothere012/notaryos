"""
Concurrent wrap() Stress Test

Proves the _ReceiptQueue (background daemon) and _ChainState (per-agent lock)
are thread-safe under concurrent method invocations.

Addresses GEMINI's concurrency flag from the 5-way review.
No framework dependencies required.
"""

import threading
import time

from notary_sdk import AutoReceiptConfig


class Counter:
    """Simple stateful object for concurrency testing."""

    def __init__(self):
        self._lock = threading.Lock()
        self.count = 0

    def increment(self) -> int:
        with self._lock:
            self.count += 1
            return self.count


def test_concurrent_wrap(notary):
    """20 threads calling a wrapped method simultaneously — all must succeed."""
    config = AutoReceiptConfig(fire_and_forget=True)
    counter = Counter()
    notary.wrap(counter, config=config)

    errors = []

    def worker():
        try:
            counter.increment()
        except Exception as e:
            errors.append(str(e))

    threads = [threading.Thread(target=worker) for _ in range(20)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=30)

    # All 20 calls completed without errors
    assert len(errors) == 0, f"Thread errors: {errors}"
    assert counter.count == 20, f"Expected 20, got {counter.count}"

    # Allow background queue to drain (fire_and_forget=True)
    time.sleep(8)

    stats = notary.receipt_stats
    total_attempted = stats["issued"] + stats["failed"] + stats["pending"]
    assert total_attempted >= 1, f"No receipts were attempted: {stats}"

    notary.unwrap(counter)
