"""
Shared fixtures for NotaryOS framework integration tests.

All tests use the official NotaryOS SDK — never the agentlayer engine internals.
Set NOTARY_API_KEY env var or defaults to a test-tier key.
"""

import os
import sys

import pytest

# Ensure the SDK is importable from this repo's source
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "sdk", "python"))

from notary_sdk import AutoReceiptConfig, NotaryClient  # noqa: E402

NOTARY_API_KEY = os.environ.get("NOTARY_API_KEY", "notary_test_integration_ci")
NOTARY_API_URL = os.environ.get(
    "NOTARY_API_URL", "https://api.agenttownsquare.com"
)


@pytest.fixture
def notary():
    """NotaryClient configured for integration testing."""
    return NotaryClient(api_key=NOTARY_API_KEY, base_url=NOTARY_API_URL)


@pytest.fixture
def sync_config():
    """AutoReceiptConfig with fire_and_forget=False for deterministic assertions.

    By default wrap() enqueues receipts to a background daemon thread.
    Setting fire_and_forget=False makes issuance synchronous so tests can
    assert on receipt_stats immediately after the wrapped method returns.
    """
    return AutoReceiptConfig(fire_and_forget=False)
