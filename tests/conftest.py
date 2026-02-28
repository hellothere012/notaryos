"""
Shared fixtures for NotaryOS framework integration tests.

All tests use the official NotaryOS SDK — never the agentlayer engine internals.
Set NOTARY_API_KEY env var for authenticated tests. Public-only tests always run.
"""

import os
import sys

import pytest

# Ensure the SDK is importable from this repo's source
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "sdk", "python"))

from notary_sdk import AutoReceiptConfig, NotaryClient  # noqa: E402

NOTARY_API_KEY = os.environ.get("NOTARY_API_KEY", "") or None
NOTARY_API_URL = os.environ.get(
    "NOTARY_API_URL", "https://api.agenttownsquare.com"
)

HAS_API_KEY = NOTARY_API_KEY is not None


@pytest.fixture
def notary_public():
    """NotaryClient without API key — for public-only operations (status, verify, public_key)."""
    return NotaryClient(base_url=NOTARY_API_URL)


@pytest.fixture
def notary():
    """NotaryClient configured for authenticated integration testing.
    Skips the test if no valid NOTARY_API_KEY is set."""
    if not HAS_API_KEY:
        pytest.skip("NOTARY_API_KEY not set — skipping authenticated test")
    return NotaryClient(api_key=NOTARY_API_KEY, base_url=NOTARY_API_URL)


@pytest.fixture
def sync_config():
    """AutoReceiptConfig with fire_and_forget=False for deterministic assertions.

    By default wrap() enqueues receipts to a background daemon thread.
    Setting fire_and_forget=False makes issuance synchronous so tests can
    assert on receipt_stats immediately after the wrapped method returns.
    """
    return AutoReceiptConfig(fire_and_forget=False)
